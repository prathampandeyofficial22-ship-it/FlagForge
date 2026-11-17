import { Types } from 'mongoose';
import { FeatureFlag, IFeatureFlag, FlagType } from '../models/FeatureFlag.js';
import {
  FlagEnvironmentConfig,
  IFlagEnvironmentConfig,
  ITargetingRule,
} from '../models/FlagEnvironmentConfig.js';
import { Environment } from '../models/Environment.js';
import { Project } from '../models/Project.js';
import { AuditLog } from '../models/AuditLog.js';
import { User } from '../models/User.js';
import { cache } from '../config/redis.js';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '../utils/errors.js';

export interface CreateFlagDTO {
  name: string;
  key: string;
  description?: string;
  type?: FlagType;
  tags?: string[];
  initialEnabled?: boolean;
}

export interface UpdateFlagDTO {
  name?: string;
  description?: string;
  tags?: string[];
}

export interface UpdateEnvironmentConfigDTO {
  enabled?: boolean;
  defaultValue?: any;
  rolloutPercentage?: number;
  rules?: ITargetingRule[];
}

export class FlagService {
  static async createFlag(
    projectId: string,
    actorId: string,
    dto: CreateFlagDTO
  ): Promise<IFeatureFlag> {
    const project = await Project.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const cleanName = dto.name.trim();
    const cleanKey = dto.key.trim().toLowerCase();

    if (!/^[a-z0-9-]+$/.test(cleanKey)) {
      throw new BadRequestError('Flag key must contain only lowercase letters, numbers, and hyphens (e.g. ai-recommendations)');
    }

    const existing = await FeatureFlag.findOne({
      projectId: project._id,
      key: cleanKey,
      isArchived: false,
    });
    if (existing) {
      throw new ConflictError(`A feature flag with key '${cleanKey}' already exists in this project.`);
    }

    const flag = await FeatureFlag.create({
      projectId: project._id,
      key: cleanKey,
      name: cleanName,
      description: dto.description?.trim() || '',
      type: dto.type || 'boolean',
      tags: dto.tags || [],
      isArchived: false,
    });

    // Auto-create environment configs for every environment in this project
    const environments = await Environment.find({ projectId: project._id });
    for (const env of environments) {
      await FlagEnvironmentConfig.create({
        flagId: flag._id,
        environmentId: env._id,
        projectId: project._id,
        enabled: dto.initialEnabled || false,
        killSwitched: false,
        defaultValue: false,
        rolloutPercentage: dto.initialEnabled ? 100 : 0,
        rules: [],
        version: 1,
        updatedBy: new Types.ObjectId(actorId),
      });
    }

    const actor = await User.findById(actorId);
    if (actor) {
      await AuditLog.create({
        organizationId: project.organizationId,
        projectId: project._id,
        actorId: actor._id,
        actorEmail: actor.email,
        action: 'flag.created',
        entityType: 'flag',
        entityId: flag._id.toString(),
        entityName: flag.name,
        afterSnapshot: { key: flag.key, name: flag.name, type: flag.type },
      });
    }

    return flag;
  }

  static async listFlags(projectId: string): Promise<any[]> {
    const flags = await FeatureFlag.find({
      projectId: new Types.ObjectId(projectId),
      isArchived: false,
    }).sort({ createdAt: -1 });

    const environments = await Environment.find({ projectId: new Types.ObjectId(projectId) }).sort({ createdAt: 1 });

    const results = [];
    for (const flag of flags) {
      const configs = await FlagEnvironmentConfig.find({ flagId: flag._id });

      const envMap: Record<string, any> = {};
      for (const env of environments) {
        const config = configs.find((c) => c.environmentId.toString() === env._id.toString());
        envMap[env.key] = {
          environmentId: env._id.toString(),
          environmentName: env.name,
          enabled: config?.enabled || false,
          killSwitched: config?.killSwitched || false,
          rolloutPercentage: config?.rolloutPercentage || 0,
          ruleCount: config?.rules?.length || 0,
        };
      }

      results.push({
        id: flag._id.toString(),
        key: flag.key,
        name: flag.name,
        description: flag.description,
        type: flag.type,
        tags: flag.tags,
        environments: envMap,
        createdAt: flag.createdAt,
        updatedAt: flag.updatedAt,
      });
    }

    return results;
  }

  static async getFlagDetail(flagId: string): Promise<any> {
    const flag = await FeatureFlag.findById(flagId);
    if (!flag) {
      throw new NotFoundError('Feature flag not found');
    }

    const environments = await Environment.find({ projectId: flag.projectId }).sort({ createdAt: 1 });
    const configs = await FlagEnvironmentConfig.find({ flagId: flag._id });

    const envConfigs = environments.map((env) => {
      const config = configs.find((c) => c.environmentId.toString() === env._id.toString());
      return {
        environmentId: env._id.toString(),
        environmentName: env.name,
        environmentKey: env.key,
        environmentType: env.type,
        enabled: config ? config.enabled : false,
        killSwitched: config ? config.killSwitched : false,
        killSwitchedAt: config?.killSwitchedAt,
        defaultValue: config ? config.defaultValue : false,
        rolloutPercentage: config ? config.rolloutPercentage : 0,
        rules: config ? config.rules : [],
        version: config ? config.version : 1,
        updatedAt: config ? config.updatedAt : flag.updatedAt,
      };
    });

    return {
      id: flag._id.toString(),
      projectId: flag.projectId.toString(),
      key: flag.key,
      name: flag.name,
      description: flag.description,
      type: flag.type,
      tags: flag.tags,
      isArchived: flag.isArchived,
      environments: envConfigs,
      createdAt: flag.createdAt,
      updatedAt: flag.updatedAt,
    };
  }

  static async updateFlag(
    flagId: string,
    actorId: string,
    dto: UpdateFlagDTO
  ): Promise<IFeatureFlag> {
    const flag = await FeatureFlag.findById(flagId);
    if (!flag) {
      throw new NotFoundError('Feature flag not found');
    }

    const beforeSnapshot = { name: flag.name, description: flag.description, tags: flag.tags };

    if (dto.name !== undefined) flag.name = dto.name.trim();
    if (dto.description !== undefined) flag.description = dto.description.trim();
    if (dto.tags !== undefined) flag.tags = dto.tags;

    await flag.save();

    const project = await Project.findById(flag.projectId);
    const actor = await User.findById(actorId);
    if (project && actor) {
      await AuditLog.create({
        organizationId: project.organizationId,
        projectId: project._id,
        actorId: actor._id,
        actorEmail: actor.email,
        action: 'flag.updated',
        entityType: 'flag',
        entityId: flag._id.toString(),
        entityName: flag.name,
        beforeSnapshot,
        afterSnapshot: { name: flag.name, description: flag.description, tags: flag.tags },
      });
    }

    return flag;
  }

  static async archiveFlag(flagId: string, actorId: string): Promise<void> {
    const flag = await FeatureFlag.findById(flagId);
    if (!flag) {
      throw new NotFoundError('Feature flag not found');
    }

    flag.isArchived = true;
    await flag.save();

    // Bust cache for this flag
    await cache.delPattern(`eval:*:${flag.key}:*`);

    const project = await Project.findById(flag.projectId);
    const actor = await User.findById(actorId);
    if (project && actor) {
      await AuditLog.create({
        organizationId: project.organizationId,
        projectId: project._id,
        actorId: actor._id,
        actorEmail: actor.email,
        action: 'flag.archived',
        entityType: 'flag',
        entityId: flag._id.toString(),
        entityName: flag.name,
      });
    }
  }

  static async getEnvironmentConfig(
    flagId: string,
    environmentId: string
  ): Promise<IFlagEnvironmentConfig> {
    let config = await FlagEnvironmentConfig.findOne({
      flagId: new Types.ObjectId(flagId),
      environmentId: new Types.ObjectId(environmentId),
    });

    if (!config) {
      const flag = await FeatureFlag.findById(flagId);
      if (!flag) throw new NotFoundError('Flag not found');

      config = await FlagEnvironmentConfig.create({
        flagId: new Types.ObjectId(flagId),
        environmentId: new Types.ObjectId(environmentId),
        projectId: flag.projectId,
        enabled: false,
        killSwitched: false,
        defaultValue: false,
        rolloutPercentage: 0,
        rules: [],
        version: 1,
      });
    }

    return config;
  }

  static async updateEnvironmentConfig(
    flagId: string,
    environmentId: string,
    actorId: string,
    dto: UpdateEnvironmentConfigDTO
  ): Promise<IFlagEnvironmentConfig> {
    const config = await this.getEnvironmentConfig(flagId, environmentId);
    const flag = await FeatureFlag.findById(flagId);
    if (!flag) throw new NotFoundError('Flag not found');

    const project = await Project.findById(flag.projectId);

    const beforeSnapshot = {
      enabled: config.enabled,
      defaultValue: config.defaultValue,
      rolloutPercentage: config.rolloutPercentage,
      rules: config.rules,
      version: config.version,
    };

    if (dto.enabled !== undefined) config.enabled = dto.enabled;
    if (dto.defaultValue !== undefined) config.defaultValue = dto.defaultValue;
    if (dto.rolloutPercentage !== undefined) {
      if (dto.rolloutPercentage < 0 || dto.rolloutPercentage > 100) {
        throw new BadRequestError('Rollout percentage must be between 0 and 100');
      }
      config.rolloutPercentage = dto.rolloutPercentage;
    }
    if (dto.rules !== undefined) {
      config.rules = dto.rules;
    }

    config.version += 1;
    config.updatedBy = new Types.ObjectId(actorId);
    await config.save();

    // Invalidate Redis evaluation cache for this environment and flag
    await cache.delPattern(`eval:${environmentId}:${flag.key}:*`);

    const actor = await User.findById(actorId);
    if (project && actor) {
      await AuditLog.create({
        organizationId: project.organizationId,
        projectId: project._id,
        environmentId: new Types.ObjectId(environmentId),
        actorId: actor._id,
        actorEmail: actor.email,
        action: dto.rolloutPercentage !== undefined ? 'rollout.updated' : 'flag.updated',
        entityType: 'flag',
        entityId: flag._id.toString(),
        entityName: flag.name,
        beforeSnapshot,
        afterSnapshot: {
          enabled: config.enabled,
          defaultValue: config.defaultValue,
          rolloutPercentage: config.rolloutPercentage,
          rulesCount: config.rules.length,
          version: config.version,
        },
      });
    }

    return config;
  }

  static async toggleFlag(
    flagId: string,
    environmentId: string,
    actorId: string
  ): Promise<{ enabled: boolean; version: number }> {
    const config = await this.getEnvironmentConfig(flagId, environmentId);
    const flag = await FeatureFlag.findById(flagId);
    if (!flag) throw new NotFoundError('Flag not found');

    const wasEnabled = config.enabled;
    config.enabled = !wasEnabled;
    if (config.enabled) {
      // If toggling on, reset kill switch
      config.killSwitched = false;
      config.killSwitchedAt = undefined;
      config.killSwitchedBy = undefined;
    }
    config.version += 1;
    config.updatedBy = new Types.ObjectId(actorId);
    await config.save();

    // Bust cache
    await cache.delPattern(`eval:${environmentId}:${flag.key}:*`);

    const project = await Project.findById(flag.projectId);
    const actor = await User.findById(actorId);
    if (project && actor) {
      await AuditLog.create({
        organizationId: project.organizationId,
        projectId: project._id,
        environmentId: new Types.ObjectId(environmentId),
        actorId: actor._id,
        actorEmail: actor.email,
        action: 'flag.toggled',
        entityType: 'flag',
        entityId: flag._id.toString(),
        entityName: flag.name,
        beforeSnapshot: { enabled: wasEnabled },
        afterSnapshot: { enabled: config.enabled, version: config.version },
      });
    }

    return { enabled: config.enabled, version: config.version };
  }

  static async triggerKillSwitch(
    flagId: string,
    environmentId: string,
    actorId: string
  ): Promise<{ killSwitched: boolean; enabled: boolean; version: number }> {
    const config = await this.getEnvironmentConfig(flagId, environmentId);
    const flag = await FeatureFlag.findById(flagId);
    if (!flag) throw new NotFoundError('Flag not found');

    config.killSwitched = true;
    config.enabled = false;
    config.killSwitchedAt = new Date();
    config.killSwitchedBy = new Types.ObjectId(actorId);
    config.version += 1;
    config.updatedBy = new Types.ObjectId(actorId);
    await config.save();

    // Instant cache bust
    await cache.delPattern(`eval:${environmentId}:${flag.key}:*`);

    const project = await Project.findById(flag.projectId);
    const actor = await User.findById(actorId);
    if (project && actor) {
      await AuditLog.create({
        organizationId: project.organizationId,
        projectId: project._id,
        environmentId: new Types.ObjectId(environmentId),
        actorId: actor._id,
        actorEmail: actor.email,
        action: 'flag.kill_switched',
        entityType: 'flag',
        entityId: flag._id.toString(),
        entityName: flag.name,
        afterSnapshot: { killSwitched: true, enabled: false, version: config.version },
      });
    }

    return {
      killSwitched: true,
      enabled: false,
      version: config.version,
    };
  }
}
