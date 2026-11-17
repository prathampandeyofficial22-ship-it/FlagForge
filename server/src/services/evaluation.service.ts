import { Types } from 'mongoose';
import { FeatureFlag } from '../models/FeatureFlag.js';
import { FlagEnvironmentConfig } from '../models/FlagEnvironmentConfig.js';
import { EvaluationMetric } from '../models/EvaluationMetric.js';
import { evaluateFlag, UserContext, EvaluationOutput } from '../engine/evaluator.js';
import { cache } from '../config/redis.js';
import { NotFoundError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export class EvaluationService {
  /**
   * Evaluates a single feature flag against the provided user context.
   * Utilizes multi-tier caching (Redis/Memory) with automatic invalidation.
   */
  static async evaluateFlag(
    environmentId: string,
    projectId: string,
    flagKey: string,
    user?: UserContext
  ): Promise<EvaluationOutput> {
    const userKey = user?.key || 'anon';
    const userAttrsHash = user?.attributes ? JSON.stringify(user.attributes) : '';
    const cacheKey = `eval:${environmentId}:${flagKey}:${userKey}:${userAttrsHash}`;

    // 1. Check Cache
    try {
      const cached = await cache.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as EvaluationOutput;
        // Asynchronously record evaluation telemetry
        this.recordTelemetry(environmentId, flagKey, parsed.enabled, parsed.reason).catch(
          (err) => logger.warn('Telemetry error:', err)
        );
        return parsed;
      }
    } catch (err) {
      logger.warn('Cache lookup failure, falling back to database', err);
    }

    // 2. Load Flag
    const flag = await FeatureFlag.findOne({
      projectId: new Types.ObjectId(projectId),
      key: flagKey.toLowerCase(),
      isArchived: false,
    });

    if (!flag) {
      throw new NotFoundError(`Feature flag '${flagKey}' not found in this project.`);
    }

    // 3. Load Environment Config
    let config = await FlagEnvironmentConfig.findOne({
      flagId: flag._id,
      environmentId: new Types.ObjectId(environmentId),
    });

    if (!config) {
      config = await FlagEnvironmentConfig.create({
        flagId: flag._id,
        environmentId: new Types.ObjectId(environmentId),
        projectId: new Types.ObjectId(projectId),
        enabled: false,
        killSwitched: false,
        defaultValue: false,
        rolloutPercentage: 0,
        rules: [],
        version: 1,
      });
    }

    // 4. Pure Rule & Rollout Evaluation
    const result = evaluateFlag(flag.key, config, user);

    // 5. Cache result for 60 seconds
    try {
      await cache.set(cacheKey, JSON.stringify(result), 60);
    } catch (err) {
      logger.warn('Cache write failure:', err);
    }

    // 6. Record Telemetry Asynchronously
    this.recordTelemetry(environmentId, flag.key, result.enabled, result.reason).catch(
      (err) => logger.warn('Telemetry error:', err)
    );

    return result;
  }

  /**
   * Batch evaluates multiple flags or all project flags for a given environment and user.
   */
  static async evaluateBatch(
    environmentId: string,
    projectId: string,
    flagKeys?: string[],
    user?: UserContext
  ): Promise<Record<string, EvaluationOutput>> {
    let query: any = {
      projectId: new Types.ObjectId(projectId),
      isArchived: false,
    };

    if (flagKeys && flagKeys.length > 0) {
      query.key = { $in: flagKeys.map((k) => k.toLowerCase()) };
    }

    const flags = await FeatureFlag.find(query);
    const results: Record<string, EvaluationOutput> = {};

    await Promise.all(
      flags.map(async (flag) => {
        try {
          const evalRes = await this.evaluateFlag(environmentId, projectId, flag.key, user);
          results[flag.key] = evalRes;
        } catch (err) {
          logger.warn(`Error evaluating flag in batch: ${flag.key}`, err);
          results[flag.key] = {
            flagKey: flag.key,
            enabled: false,
            value: false,
            reason: 'DEFAULT_FALLBACK',
            version: 0,
          };
        }
      })
    );

    return results;
  }

  /**
   * Increments real-time telemetry bucket in MongoDB.
   */
  private static async recordTelemetry(
    environmentId: string,
    flagKey: string,
    enabled: boolean,
    reason: string
  ): Promise<void> {
    try {
      const now = new Date();
      // Round to top of the hour
      const hour = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), 0, 0, 0)
      );

      const incField: Record<string, number> = {
        totalEvaluations: 1,
      };

      if (enabled) {
        incField.evalTrueCount = 1;
      } else {
        incField.evalFalseCount = 1;
      }

      switch (reason) {
        case 'RULE_MATCH':
          incField['reasonBreakdown.ruleMatch'] = 1;
          break;
        case 'PERCENTAGE_ROLLOUT':
          incField['reasonBreakdown.percentageRollout'] = 1;
          break;
        case 'DEFAULT_FALLBACK':
          incField['reasonBreakdown.defaultFallback'] = 1;
          break;
        case 'KILL_SWITCH':
          incField['reasonBreakdown.killSwitch'] = 1;
          break;
        case 'FLAG_DISABLED':
          incField['reasonBreakdown.disabled'] = 1;
          break;
      }

      await EvaluationMetric.updateOne(
        {
          environmentId: new Types.ObjectId(environmentId),
          flagKey,
          hour,
        },
        {
          $inc: incField,
        },
        { upsert: true }
      );
    } catch (err) {
      // Telemetry should never crash evaluation requests
      logger.debug('Telemetry recording note:', err);
    }
  }
}
