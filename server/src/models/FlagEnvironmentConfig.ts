import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type RuleOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual'
  | 'in'
  | 'notIn';

export interface ITargetingCondition {
  attribute: string;
  operator: RuleOperator;
  values: string[];
}

export interface ITargetingRule {
  id: string;
  name: string;
  priority: number;
  conditions: ITargetingCondition[];
  conditionOperator: 'AND' | 'OR';
  serveValue: any;
  rolloutPercentage?: number;
}

export interface IFlagEnvironmentConfig extends Document {
  flagId: Types.ObjectId;
  environmentId: Types.ObjectId;
  projectId: Types.ObjectId;
  enabled: boolean;
  killSwitched: boolean;
  killSwitchedAt?: Date;
  killSwitchedBy?: Types.ObjectId;
  defaultValue: any;
  rolloutPercentage: number;
  rules: ITargetingRule[];
  version: number;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TargetingConditionSchema = new Schema<ITargetingCondition>(
  {
    attribute: { type: String, required: true },
    operator: {
      type: String,
      enum: [
        'equals',
        'notEquals',
        'contains',
        'notContains',
        'startsWith',
        'endsWith',
        'greaterThan',
        'lessThan',
        'greaterThanOrEqual',
        'lessThanOrEqual',
        'in',
        'notIn',
      ],
      required: true,
    },
    values: { type: [String], required: true },
  },
  { _id: false }
);

const TargetingRuleSchema = new Schema<ITargetingRule>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    priority: { type: Number, required: true, default: 0 },
    conditions: { type: [TargetingConditionSchema], default: [] },
    conditionOperator: { type: String, enum: ['AND', 'OR'], default: 'AND' },
    serveValue: { type: Schema.Types.Mixed, default: true },
    rolloutPercentage: { type: Number, min: 0, max: 100 },
  },
  { _id: false }
);

const FlagEnvironmentConfigSchema = new Schema<IFlagEnvironmentConfig>(
  {
    flagId: {
      type: Schema.Types.ObjectId,
      ref: 'FeatureFlag',
      required: true,
      index: true,
    },
    environmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Environment',
      required: true,
      index: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    enabled: {
      type: Boolean,
      default: false,
    },
    killSwitched: {
      type: Boolean,
      default: false,
    },
    killSwitchedAt: {
      type: Date,
      default: null,
    },
    killSwitchedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    defaultValue: {
      type: Schema.Types.Mixed,
      default: false,
    },
    rolloutPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    rules: {
      type: [TargetingRuleSchema],
      default: [],
    },
    version: {
      type: Number,
      default: 1,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index ensuring one configuration per flag per environment
FlagEnvironmentConfigSchema.index({ flagId: 1, environmentId: 1 }, { unique: true });
FlagEnvironmentConfigSchema.index({ environmentId: 1, enabled: 1 });

export const FlagEnvironmentConfig: Model<IFlagEnvironmentConfig> =
  mongoose.models.FlagEnvironmentConfig ||
  mongoose.model<IFlagEnvironmentConfig>('FlagEnvironmentConfig', FlagEnvironmentConfigSchema);
