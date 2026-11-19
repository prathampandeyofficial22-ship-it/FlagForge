import {
  IFlagEnvironmentConfig,
  ITargetingRule,
  ITargetingCondition,
  RuleOperator,
} from '../models/FlagEnvironmentConfig.js';
import { isUserInRollout, getRolloutBucket } from '../utils/hashing.js';

export interface UserContext {
  key: string;
  attributes?: Record<string, any>;
}

export type EvaluationReason =
  | 'KILL_SWITCH'
  | 'FLAG_DISABLED'
  | 'RULE_MATCH'
  | 'PERCENTAGE_ROLLOUT'
  | 'DEFAULT_FALLBACK';

export interface EvaluationOutput<T = any> {
  flagKey: string;
  enabled: boolean;
  value: T;
  reason: EvaluationReason;
  matchedRuleId?: string;
  matchedRuleName?: string;
  rolloutBucket?: number;
  version: number;
}

/**
 * Evaluates a single condition against the user context attributes.
 */
export function evaluateCondition(
  condition: ITargetingCondition,
  user: UserContext
): boolean {
  const { attribute, operator, values } = condition;

  // Extract user attribute value: check user.key or user.attributes[attribute]
  let userValue: any;
  if (attribute === 'key' || attribute === 'userId' || attribute === 'id') {
    userValue = user.key;
  } else {
    userValue = user.attributes ? user.attributes[attribute] : undefined;
  }

  if (userValue === undefined || userValue === null) {
    return false;
  }

  const userStr = String(userValue).trim();
  const userNum = Number(userValue);

  switch (operator) {
    case 'equals':
      return values.some((v) => v.trim().toLowerCase() === userStr.toLowerCase());

    case 'notEquals':
      return values.every((v) => v.trim().toLowerCase() !== userStr.toLowerCase());

    case 'contains':
      return values.some((v) => userStr.toLowerCase().includes(v.trim().toLowerCase()));

    case 'notContains':
      return values.every((v) => !userStr.toLowerCase().includes(v.trim().toLowerCase()));

    case 'startsWith':
      return values.some((v) => userStr.toLowerCase().startsWith(v.trim().toLowerCase()));

    case 'endsWith':
      return values.some((v) => userStr.toLowerCase().endsWith(v.trim().toLowerCase()));

    case 'in':
      return values.some((v) => v.trim() === userStr);

    case 'notIn':
      return values.every((v) => v.trim() !== userStr);

    case 'greaterThan':
      if (isNaN(userNum)) return false;
      return values.some((v) => !isNaN(Number(v)) && userNum > Number(v));

    case 'lessThan':
      if (isNaN(userNum)) return false;
      return values.some((v) => !isNaN(Number(v)) && userNum < Number(v));

    case 'greaterThanOrEqual':
      if (isNaN(userNum)) return false;
      return values.some((v) => !isNaN(Number(v)) && userNum >= Number(v));

    case 'lessThanOrEqual':
      if (isNaN(userNum)) return false;
      return values.some((v) => !isNaN(Number(v)) && userNum <= Number(v));

    default:
      return false;
  }
}

/**
 * Evaluates a targeting rule with its combined conditions.
 */
export function evaluateRule(
  rule: ITargetingRule,
  user: UserContext,
  flagKey: string
): boolean {
  if (!rule.conditions || rule.conditions.length === 0) {
    return false;
  }

  let matches = false;
  if (rule.conditionOperator === 'OR') {
    matches = rule.conditions.some((cond) => evaluateCondition(cond, user));
  } else {
    // Default 'AND'
    matches = rule.conditions.every((cond) => evaluateCondition(cond, user));
  }

  if (!matches) return false;

  // If rule has an optional rollout percentage constraint within the matched group
  if (rule.rolloutPercentage !== undefined && rule.rolloutPercentage < 100) {
    return isUserInRollout(`${flagKey}:${rule.id}`, user.key, rule.rolloutPercentage);
  }

  return true;
}

/**
 * Pure evaluation function.
 * Evaluates a flag's environment configuration against a user context.
 */
export function evaluateFlag(
  flagKey: string,
  config: IFlagEnvironmentConfig,
  user?: UserContext
): EvaluationOutput {
  const version = config.version || 1;

  // 1. Emergency Kill Switch Check
  if (config.killSwitched) {
    return {
      flagKey,
      enabled: false,
      value: false,
      reason: 'KILL_SWITCH',
      version,
    };
  }

  // 2. Master Flag Enabled Check
  if (!config.enabled) {
    return {
      flagKey,
      enabled: false,
      value: false,
      reason: 'FLAG_DISABLED',
      version,
    };
  }

  // If user context is provided, evaluate targeting rules and canary rollout
  if (user && user.key) {
    // 3. Targeting Rules Evaluation (sorted by ascending priority)
    const sortedRules = [...(config.rules || [])].sort((a, b) => a.priority - b.priority);

    for (const rule of sortedRules) {
      if (evaluateRule(rule, user, flagKey)) {
        return {
          flagKey,
          enabled: Boolean(rule.serveValue),
          value: rule.serveValue,
          reason: 'RULE_MATCH',
          matchedRuleId: rule.id,
          matchedRuleName: rule.name,
          version,
        };
      }
    }

    // 4. Default Percentage Rollout Check
    const bucket = getRolloutBucket(flagKey, user.key);
    const inRollout = bucket < config.rolloutPercentage;

    return {
      flagKey,
      enabled: inRollout,
      value: inRollout ? true : config.defaultValue,
      reason: 'PERCENTAGE_ROLLOUT',
      rolloutBucket: bucket,
      version,
    };
  }

  // 5. Fallback Default (e.g. anonymous or no user context)
  const isDefaultRolloutOn = config.rolloutPercentage === 100;
  return {
    flagKey,
    enabled: isDefaultRolloutOn || Boolean(config.defaultValue),
    value: isDefaultRolloutOn ? true : config.defaultValue,
    reason: 'DEFAULT_FALLBACK',
    version,
  };
}
