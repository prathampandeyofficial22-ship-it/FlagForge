import { Types } from 'mongoose';
import { Environment, IEnvironment } from '../models/Environment.js';
import { Project } from '../models/Project.js';
import { FeatureFlag } from '../models/FeatureFlag.js';
import { FlagEnvironmentConfig } from '../models/FlagEnvironmentConfig.js';
import { AuditLog } from '../models/AuditLog.js';
import { User } from '../models/User.js';
import { generateApiKey } from '../utils/hashing.js';
import { cache } from '../config/redis.js';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '../utils/errors.js';

export interface CreateEnvironmentDTO {
  name: string;
  key?: string;
  type?: 'development' | 'staging' | 'production' | 'custom';
}

export class EnvironmentService {
  static async listEnvironments(projectId: string): Promise<IEnvironment[]> {
    return Environment.find({ projectId: new Types.ObjectId(projectId) }).sort({ createdAt: 1 });
  }

  static async createEnvironment(
    projectId: string,
    actorId: string,
    dto: CreateEnvironmentDTO
  ): Promise<{ environment: IEnvironment; serverApiKey: string; clientApiKey: string }> {
    const project = await Project.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const cleanName = dto.name.trim();
    let key = dto.key?.trim().toLowerCase();
    if (!key) {
      key = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      if (!key || key === '-') key = 'env';
    }

    if (!/^[a-z0-9-]+$/.test(key)) {
      throw new BadRequestError('Environment key must contain only lowercase alphanumeric characters and hyphens.');
    }

    const existing = await Environment.findOne({ projectId: project._id, key });
    if (existing) {
      throw new ConflictError(`Environment with key '${key}' already exists in this project.`);
    }

    const serverKey = generateApiKey('server', `${project.key}_${key}`);
    const clientKey = generateApiKey('client', `${project.key}_${key}`);

    const environment = await Environment.create({
      projectId: project._id,
      name: cleanName,
      key,
      type: dto.type || 'custom',
      serverApiKeyHash: serverKey.hashedKey,
      serverApiKeyPrefix: serverKey.prefix,
      clientApiKeyHash: clientKey.hashedKey,
      clientApiKeyPrefix: clientKey.prefix,
    });

    // Automatically create default config records for all existing flags in this project
    const flags = await FeatureFlag.find({ projectId: project._id, isArchived: false });
    for (const flag of flags) {
      await FlagEnvironmentConfig.create({
        flagId: flag._id,
        environmentId: environment._id,
        projectId: project._id,
        enabled: false,
        killSwitched: false,
        defaultValue: false,
        rolloutPercentage: 0,
        rules: [],
        version: 1,
      });
    }

    const actor = await User.findById(actorId);
    if (actor) {
      await AuditLog.create({
        organizationId: project.organizationId,
        projectId: project._id,
        environmentId: environment._id,
        actorId: actor._id,
        actorEmail: actor.email,
        action: 'environment.created',
        entityType: 'environment',
        entityId: environment._id.toString(),
        entityName: environment.name,
        afterSnapshot: { name: environment.name, key: environment.key },
      });
    }

    return {
      environment,
      serverApiKey: serverKey.rawKey,
      clientApiKey: clientKey.rawKey,
    };
  }

  static async rotateKeys(
    environmentId: string,
    actorId: string
  ): Promise<{ serverApiKey: string; clientApiKey: string; serverApiKeyPrefix: string; clientApiKeyPrefix: string }> {
    const environment = await Environment.findById(environmentId).populate<{ projectId: any }>('projectId');
    if (!environment) {
      throw new NotFoundError('Environment not found');
    }

    const projectKey = environment.projectId?.key || 'proj';
    const serverKey = generateApiKey('server', `${projectKey}_${environment.key}`);
    const clientKey = generateApiKey('client', `${projectKey}_${environment.key}`);

    environment.serverApiKeyHash = serverKey.hashedKey;
    environment.serverApiKeyPrefix = serverKey.prefix;
    environment.clientApiKeyHash = clientKey.hashedKey;
    environment.clientApiKeyPrefix = clientKey.prefix;
    await environment.save();

    // Invalidate Redis cache for this environment
    await cache.delPattern(`eval:${environmentId}:*`);

    const actor = await User.findById(actorId);
    if (actor) {
      await AuditLog.create({
        organizationId: environment.projectId.organizationId,
        projectId: environment.projectId._id,
        environmentId: environment._id,
        actorId: actor._id,
        actorEmail: actor.email,
        action: 'environment.key_rotated',
        entityType: 'environment',
        entityId: environment._id.toString(),
        entityName: environment.name,
      });
    }

    return {
      serverApiKey: serverKey.rawKey,
      clientApiKey: clientKey.rawKey,
      serverApiKeyPrefix: serverKey.prefix,
      clientApiKeyPrefix: clientKey.prefix,
    };
  }

  static async getByApiKeyHash(keyHash: string): Promise<IEnvironment | null> {
    return Environment.findOne({
      $or: [
        { serverApiKeyHash: keyHash },
        { clientApiKeyHash: keyHash },
      ],
    });
  }
}
