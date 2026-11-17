import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type AuditAction =
  | 'flag.created'
  | 'flag.updated'
  | 'flag.toggled'
  | 'flag.kill_switched'
  | 'flag.archived'
  | 'rule.created'
  | 'rule.updated'
  | 'rule.deleted'
  | 'rollout.updated'
  | 'environment.created'
  | 'environment.key_rotated'
  | 'project.created'
  | 'project.updated'
  | 'organization.created'
  | 'member.invited'
  | 'member.removed'
  | 'member.role_updated';

export interface IAuditLog extends Document {
  organizationId: Types.ObjectId;
  projectId?: Types.ObjectId;
  environmentId?: Types.ObjectId;
  actorId: Types.ObjectId;
  actorEmail: string;
  action: AuditAction;
  entityType: 'flag' | 'project' | 'environment' | 'organization' | 'rule' | 'member';
  entityId: string;
  entityName: string;
  beforeSnapshot?: Record<string, any>;
  afterSnapshot?: Record<string, any>;
  diff?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      index: true,
      default: null,
    },
    environmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Environment',
      index: true,
      default: null,
    },
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    actorEmail: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    entityType: {
      type: String,
      enum: ['flag', 'project', 'environment', 'organization', 'rule', 'member'],
      required: true,
    },
    entityId: {
      type: String,
      required: true,
    },
    entityName: {
      type: String,
      required: true,
    },
    beforeSnapshot: {
      type: Schema.Types.Mixed,
      default: null,
    },
    afterSnapshot: {
      type: Schema.Types.Mixed,
      default: null,
    },
    diff: {
      type: Schema.Types.Mixed,
      default: null,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Append-only! No updatedAt
  }
);

// Indexes for fast querying of audit records
AuditLogSchema.index({ organizationId: 1, createdAt: -1 });
AuditLogSchema.index({ projectId: 1, createdAt: -1 });
AuditLogSchema.index({ entityId: 1, createdAt: -1 });

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
