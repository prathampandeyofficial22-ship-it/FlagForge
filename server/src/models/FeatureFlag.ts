import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type FlagType = 'boolean' | 'string' | 'number' | 'json';

export interface IFeatureFlag extends Document {
  projectId: Types.ObjectId;
  key: string;
  name: string;
  description?: string;
  type: FlagType;
  tags: string[];
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FeatureFlagSchema = new Schema<IFeatureFlag>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    key: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    type: {
      type: String,
      enum: ['boolean', 'string', 'number', 'json'],
      default: 'boolean',
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index ensuring flag keys are unique within a project
FeatureFlagSchema.index({ projectId: 1, key: 1 }, { unique: true });

export const FeatureFlag: Model<IFeatureFlag> =
  mongoose.models.FeatureFlag || mongoose.model<IFeatureFlag>('FeatureFlag', FeatureFlagSchema);
