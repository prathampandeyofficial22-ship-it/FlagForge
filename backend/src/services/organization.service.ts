import { Types } from 'mongoose';
import crypto from 'node:crypto';
import { Organization } from '../models/Organization.js';
import { OrganizationMember, OrgRole } from '../models/OrganizationMember.js';
import { User } from '../models/User.js';
import { Project } from '../models/Project.js';
import { Environment } from '../models/Environment.js';
import { generateApiKey } from '../utils/hashing.js';
import { AuditLog } from '../models/AuditLog.js';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../utils/errors.js';

export class OrganizationService {
  static async createOrganization(userId: string, name: string): Promise<any> {
    const cleanName = name.trim();
    if (!cleanName) {
      throw new BadRequestError('Organization name is required');
    }

    let baseSlug = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    if (!baseSlug || baseSlug === '-') baseSlug = 'org';
    const slug = `${baseSlug}-${crypto.randomBytes(3).toString('hex')}`;

    const org = await Organization.create({
      name: cleanName,
      slug,
    });

    const userObjId = new Types.ObjectId(userId);
    await OrganizationMember.create({
      organizationId: org._id,
      userId: userObjId,
      role: 'owner',
    });

    // Create default project for rapid onboarding
    const defaultProject = await Project.create({
      organizationId: org._id,
      name: 'Default Project',
      key: 'default',
      description: 'Default project generated on workspace creation',
    });

    // Create default environments: development, staging, production
    const envTypes: Array<{ name: string; key: string; type: 'development' | 'staging' | 'production' }> = [
      { name: 'Development', key: 'development', type: 'development' },
      { name: 'Staging', key: 'staging', type: 'staging' },
      { name: 'Production', key: 'production', type: 'production' },
    ];

    for (const env of envTypes) {
      const serverKey = generateApiKey('server', env.key);
      const clientKey = generateApiKey('client', env.key);

      await Environment.create({
        projectId: defaultProject._id,
        name: env.name,
        key: env.key,
        type: env.type,
        serverApiKeyHash: serverKey.hashedKey,
        serverApiKeyPrefix: serverKey.prefix,
        clientApiKeyHash: clientKey.hashedKey,
        clientApiKeyPrefix: clientKey.prefix,
      });
    }

    const user = await User.findById(userId);
    if (user) {
      await AuditLog.create({
        organizationId: org._id,
        actorId: user._id,
        actorEmail: user.email,
        action: 'organization.created',
        entityType: 'organization',
        entityId: org._id.toString(),
        entityName: org.name,
        afterSnapshot: { name: org.name, slug: org.slug },
      });
    }

    return org;
  }

  static async listUserOrganizations(userId: string): Promise<any[]> {
    const memberships = await OrganizationMember.find({ userId: new Types.ObjectId(userId) })
      .populate('organizationId')
      .exec();

    return memberships
      .filter((m) => m.organizationId)
      .map((m: any) => ({
        id: m.organizationId._id.toString(),
        name: m.organizationId.name,
        slug: m.organizationId.slug,
        role: m.role,
        joinedAt: m.joinedAt,
      }));
  }

  static async getOrganization(orgId: string): Promise<any> {
    const org = await Organization.findById(orgId);
    if (!org) {
      throw new NotFoundError('Organization not found');
    }
    return org;
  }

  static async listMembers(orgId: string): Promise<any[]> {
    const members = await OrganizationMember.find({ organizationId: new Types.ObjectId(orgId) })
      .populate('userId', 'name email createdAt lastLoginAt')
      .exec();

    return members.map((m: any) => ({
      id: m._id.toString(),
      role: m.role,
      joinedAt: m.joinedAt,
      user: m.userId
        ? {
            id: m.userId._id.toString(),
            name: m.userId.name,
            email: m.userId.email,
            lastLoginAt: m.userId.lastLoginAt,
          }
        : null,
    }));
  }

  static async addMember(
    orgId: string,
    actorId: string,
    email: string,
    role: OrgRole = 'developer'
  ): Promise<any> {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new NotFoundError(`No user found with email '${email}'. They must register first.`);
    }

    const orgObjId = new Types.ObjectId(orgId);
    const existing = await OrganizationMember.findOne({
      organizationId: orgObjId,
      userId: user._id,
    });

    if (existing) {
      throw new ConflictError('User is already a member of this organization');
    }

    const member = await OrganizationMember.create({
      organizationId: orgObjId,
      userId: user._id,
      role,
      invitedBy: new Types.ObjectId(actorId),
    });

    const actor = await User.findById(actorId);
    if (actor) {
      await AuditLog.create({
        organizationId: orgObjId,
        actorId: actor._id,
        actorEmail: actor.email,
        action: 'member.invited',
        entityType: 'member',
        entityId: member._id.toString(),
        entityName: user.email,
        afterSnapshot: { email: user.email, role },
      });
    }

    return {
      id: member._id.toString(),
      role: member.role,
      joinedAt: member.joinedAt,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
    };
  }

  static async updateMemberRole(
    orgId: string,
    actorId: string,
    memberId: string,
    newRole: OrgRole
  ): Promise<any> {
    const member = await OrganizationMember.findOne({
      _id: new Types.ObjectId(memberId),
      organizationId: new Types.ObjectId(orgId),
    }).populate('userId', 'email name');

    if (!member) {
      throw new NotFoundError('Organization member not found');
    }

    // Protect last owner from being demoted
    if (member.role === 'owner' && newRole !== 'owner') {
      const ownerCount = await OrganizationMember.countDocuments({
        organizationId: new Types.ObjectId(orgId),
        role: 'owner',
      });
      if (ownerCount <= 1) {
        throw new BadRequestError('Cannot demote the only owner of the organization');
      }
    }

    const oldRole = member.role;
    member.role = newRole;
    await member.save();

    const actor = await User.findById(actorId);
    if (actor) {
      await AuditLog.create({
        organizationId: new Types.ObjectId(orgId),
        actorId: actor._id,
        actorEmail: actor.email,
        action: 'member.role_updated',
        entityType: 'member',
        entityId: member._id.toString(),
        entityName: (member.userId as any)?.email || 'member',
        beforeSnapshot: { role: oldRole },
        afterSnapshot: { role: newRole },
      });
    }

    return member;
  }

  static async removeMember(orgId: string, actorId: string, memberId: string): Promise<void> {
    const member = await OrganizationMember.findOne({
      _id: new Types.ObjectId(memberId),
      organizationId: new Types.ObjectId(orgId),
    }).populate('userId', 'email');

    if (!member) {
      throw new NotFoundError('Member not found');
    }

    if (member.role === 'owner') {
      const ownerCount = await OrganizationMember.countDocuments({
        organizationId: new Types.ObjectId(orgId),
        role: 'owner',
      });
      if (ownerCount <= 1) {
        throw new BadRequestError('Cannot remove the only owner of the organization');
      }
    }

    await member.deleteOne();

    const actor = await User.findById(actorId);
    if (actor) {
      await AuditLog.create({
        organizationId: new Types.ObjectId(orgId),
        actorId: actor._id,
        actorEmail: actor.email,
        action: 'member.removed',
        entityType: 'member',
        entityId: memberId,
        entityName: (member.userId as any)?.email || 'member',
      });
    }
  }
}
