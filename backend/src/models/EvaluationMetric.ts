import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface IEvaluationMetric extends Document {
  environmentId: Types.ObjectId;
  flagKey: string;
  hour: Date;
  totalEvaluations: number;
  evalTrueCount: number;
  evalFalseCount: number;
  reasonBreakdown: {
    ruleMatch: number;
    percentageRollout: number;
    defaultFallback: number;
    killSwitch: number;
    disabled: number;
  };
}

const EvaluationMetricSchema = new Schema<IEvaluationMetric>(
  {
    environmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Environment',
      required: true,
      index: true,
    },
    flagKey: {
      type: String,
      required: true,
    },
    hour: {
      type: Date,
      required: true,
    },
    totalEvaluations: {
      type: Number,
      default: 0,
    },
    evalTrueCount: {
      type: Number,
      default: 0,
    },
    evalFalseCount: {
      type: Number,
      default: 0,
    },
    reasonBreakdown: {
      ruleMatch: { type: Number, default: 0 },
      percentageRollout: { type: Number, default: 0 },
      defaultFallback: { type: Number, default: 0 },
      killSwitch: { type: Number, default: 0 },
      disabled: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index ensuring one bucket per hour per flag per environment
EvaluationMetricSchema.index({ environmentId: 1, flagKey: 1, hour: 1 }, { unique: true });
EvaluationMetricSchema.index({ environmentId: 1, hour: -1 });

export const EvaluationMetric: Model<IEvaluationMetric> =
  mongoose.models.EvaluationMetric ||
  mongoose.model<IEvaluationMetric>('EvaluationMetric', EvaluationMetricSchema);
