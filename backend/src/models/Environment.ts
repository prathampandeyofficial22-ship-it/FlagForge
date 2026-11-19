import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type EnvironmentType = 'development' | 'staging' | 'production' | 'custom';

export interface IEnvironment extends Document {
  projectId: Types.ObjectId;
  name: string;
  key: string;
  type: EnvironmentType;
  serverApiKeyHash: string;
  serverApiKeyPrefix: string;
  clientApiKeyHash: string;
  clientApiKeyPrefix: string;
  createdAt: Date;
  updatedAt: Date;
}

const EnvironmentSchema = new Schema<IEnvironment>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    key: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['development', 'staging', 'production', 'custom'],
      default: 'development',
      required: true,
    },
    serverApiKeyHash: {
      type: String,
      required: true,
      index: true,
    },
    serverApiKeyPrefix: {
      type: String,
      required: true,
    },
    clientApiKeyHash: {
      type: String,
      required: true,
      index: true,
    },
    clientApiKeyPrefix: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index ensuring environment keys are unique within a project
EnvironmentSchema.index({ projectId: 1, key: 1 }, { unique: true });

export const Environment: Model<IEnvironment> =
  mongoose.models.Environment || mongoose.model<IEnvironment>('Environment', EnvironmentSchema);
