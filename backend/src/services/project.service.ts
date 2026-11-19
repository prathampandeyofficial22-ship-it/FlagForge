import { Types } from 'mongoose';
import { Project, IProject } from '../models/Project.js';
import { Environment, IEnvironment } from '../models/Environment.js';
import { FeatureFlag } from '../models/FeatureFlag.js';
import { FlagEnvironmentConfig } from '../models/FlagEnvironmentConfig.js';
import { AuditLog } from '../models/AuditLog.js';
import { User } from '../models/User.js';
import { generateApiKey } from '../utils/hashing.js';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '../utils/errors.js';

export interface CreateProjectDTO {
  name: string;
  key?: string;
  description?: string;
}

export interface UpdateProjectDTO {
  name?: string;
  description?: string;
}

export class ProjectService {
  static async createProject(
    organizationId: string,
    actorId: string,
    dto: CreateProjectDTO
  ): Promise<{ project: IProject; environments: Array<{ id: string; name: string; key: string; serverKey: string; clientKey: string }> }> {
    const orgObjId = new Types.ObjectId(organizationId);
    const cleanName = dto.name.trim();

    let key = dto.key?.trim().toLowerCase();
    if (!key) {
      key = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      if (!key || key === '-') key = 'project';
    }

    // Verify key format
    if (!/^[a-z0-9-]+$/.test(key)) {
      throw new BadRequestError('Project key must contain only lowercase alphanumeric characters and hyphens.');
    }

    const existing = await Project.findOne({ organizationId: orgObjId, key });
    if (existing) {
      throw new ConflictError(`A project with key '${key}' already exists in this organization.`);
    }

    const project = await Project.create({
      organizationId: orgObjId,
      name: cleanName,
      key,
      description: dto.description?.trim() || '',
    });

    // Automatically create default environments: Development, Staging, Production
    const envDefs: Array<{ name: string; key: string; type: 'development' | 'staging' | 'production' }> = [
      { name: 'Development', key: 'development', type: 'development' },
      { name: 'Staging', key: 'staging', type: 'staging' },
      { name: 'Production', key: 'production', type: 'production' },
    ];

    const createdEnvs: Array<{ id: string; name: string; key: string; serverKey: string; clientKey: string }> = [];

    for (const def of envDefs) {
      const serverKey = generateApiKey('server', `${key}_${def.key}`);
      const clientKey = generateApiKey('client', `${key}_${def.key}`);

      const env = await Environment.create({
        projectId: project._id,
        name: def.name,
        key: def.key,
        type: def.type,
        serverApiKeyHash: serverKey.hashedKey,
        serverApiKeyPrefix: serverKey.prefix,
        clientApiKeyHash: clientKey.hashedKey,
        clientApiKeyPrefix: clientKey.prefix,
      });

      createdEnvs.push({
        id: env._id.toString(),
        name: env.name,
        key: env.key,
        serverKey: serverKey.rawKey,
        clientKey: clientKey.rawKey,
      });
    }

    const actor = await User.findById(actorId);
    if (actor) {
      await AuditLog.create({
        organizationId: orgObjId,
        projectId: project._id,
        actorId: actor._id,
        actorEmail: actor.email,
        action: 'project.created',
        entityType: 'project',
        entityId: project._id.toString(),
        entityName: project.name,
        afterSnapshot: { name: project.name, key: project.key },
      });
    }

    return {
      project,
      environments: createdEnvs,
    };
  }

  static async listProjects(organizationId: string): Promise<any[]> {
    const projects = await Project.find({
      organizationId: new Types.ObjectId(organizationId),
    }).sort({ createdAt: -1 });

    const results = [];
    for (const project of projects) {
      const flagCount = await FeatureFlag.countDocuments({
        projectId: project._id,
        isArchived: false,
      });
      const environments = await Environment.find({ projectId: project._id }).select('name key type serverApiKeyPrefix clientApiKeyPrefix');

      results.push({
        id: project._id.toString(),
        name: project.name,
        key: project.key,
        description: project.description,
        flagCount,
        environments,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      });
    }

    return results;
  }

  static async getProjectById(projectId: string): Promise<any> {
    const project = await Project.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const environments = await Environment.find({ projectId: project._id });
    const flagCount = await FeatureFlag.countDocuments({ projectId: project._id, isArchived: false });

    return {
      id: project._id.toString(),
      organizationId: project.organizationId.toString(),
      name: project.name,
      key: project.key,
      description: project.description,
      flagCount,
      environments,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }

  static async updateProject(
    projectId: string,
    actorId: string,
    dto: UpdateProjectDTO
  ): Promise<IProject> {
    const project = await Project.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const beforeSnapshot = { name: project.name, description: project.description };

    if (dto.name !== undefined) project.name = dto.name.trim();
    if (dto.description !== undefined) project.description = dto.description.trim();

    await project.save();

    const actor = await User.findById(actorId);
    if (actor) {
      await AuditLog.create({
        organizationId: project.organizationId,
        projectId: project._id,
        actorId: actor._id,
        actorEmail: actor.email,
        action: 'project.updated',
        entityType: 'project',
        entityId: project._id.toString(),
        entityName: project.name,
        beforeSnapshot,
        afterSnapshot: { name: project.name, description: project.description },
      });
    }

    return project;
  }

  static async deleteProject(projectId: string, actorId: string): Promise<void> {
    const project = await Project.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Cascade delete flags, environments, and configs
    await FeatureFlag.deleteMany({ projectId: project._id });
    await FlagEnvironmentConfig.deleteMany({ projectId: project._id });
    await Environment.deleteMany({ projectId: project._id });
    await project.deleteOne();

    const actor = await User.findById(actorId);
    if (actor) {
      await AuditLog.create({
        organizationId: project.organizationId,
        projectId: project._id,
        actorId: actor._id,
        actorEmail: actor.email,
        action: 'project.updated',
        entityType: 'project',
        entityId: projectId,
        entityName: project.name,
        beforeSnapshot: { name: project.name, key: project.key },
      });
    }
  }
}
