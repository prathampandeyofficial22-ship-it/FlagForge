import { Types } from 'mongoose';
import { Project } from '../models/Project.js';
import { Environment } from '../models/Environment.js';
import { FeatureFlag } from '../models/FeatureFlag.js';
import { FlagEnvironmentConfig } from '../models/FlagEnvironmentConfig.js';
import { AuditLog } from '../models/AuditLog.js';
import { EvaluationMetric } from '../models/EvaluationMetric.js';

export class AnalyticsService {
  /**
   * Returns aggregate dashboard metrics for an entire organization.
   */
  static async getOrganizationAnalytics(organizationId: string): Promise<any> {
    const orgObjId = new Types.ObjectId(organizationId);

    const projects = await Project.find({ organizationId: orgObjId });
    const projectIds = projects.map((p) => p._id);

    const totalProjects = projects.length;

    const totalFlags = await FeatureFlag.countDocuments({
      projectId: { $in: projectIds },
      isArchived: false,
    });

    const environments = await Environment.find({ projectId: { $in: projectIds } });
    const environmentIds = environments.map((e) => e._id);

    const configs = await FlagEnvironmentConfig.find({
      projectId: { $in: projectIds },
    });

    const activeFlags = configs.filter((c) => c.enabled && !c.killSwitched).length;
    const disabledFlags = configs.filter((c) => !c.enabled && !c.killSwitched).length;
    const killSwitchedFlags = configs.filter((c) => c.killSwitched).length;

    // Recent audit events
    const recentAuditLogs = await AuditLog.find({ organizationId: orgObjId })
      .sort({ createdAt: -1 })
      .limit(10);

    // Telemetry summary (last 24 hours)
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const metrics = await EvaluationMetric.aggregate([
      {
        $match: {
          environmentId: { $in: environmentIds },
          hour: { $gte: since },
        },
      },
      {
        $group: {
          _id: null,
          totalEvaluations: { $sum: '$totalEvaluations' },
          evalTrueCount: { $sum: '$evalTrueCount' },
          evalFalseCount: { $sum: '$evalFalseCount' },
          ruleMatchCount: { $sum: '$reasonBreakdown.ruleMatch' },
          rolloutCount: { $sum: '$reasonBreakdown.percentageRollout' },
          fallbackCount: { $sum: '$reasonBreakdown.defaultFallback' },
          killSwitchCount: { $sum: '$reasonBreakdown.killSwitch' },
        },
      },
    ]);

    const telemetry = metrics[0] || {
      totalEvaluations: 0,
      evalTrueCount: 0,
      evalFalseCount: 0,
      ruleMatchCount: 0,
      rolloutCount: 0,
      fallbackCount: 0,
      killSwitchCount: 0,
    };

    return {
      totalProjects,
      totalFlags,
      totalEnvironments: environments.length,
      activeFlags,
      disabledFlags,
      killSwitchedFlags,
      telemetry,
      recentAuditLogs,
    };
  }

  /**
   * Returns project-scoped analytics and hourly evaluation timeseries for charts.
   */
  static async getProjectAnalytics(projectId: string): Promise<any> {
    const projObjId = new Types.ObjectId(projectId);

    const flags = await FeatureFlag.find({ projectId: projObjId, isArchived: false });
    const environments = await Environment.find({ projectId: projObjId });
    const envIds = environments.map((e) => e._id);

    const configs = await FlagEnvironmentConfig.find({ projectId: projObjId });

    const activeCount = configs.filter((c) => c.enabled && !c.killSwitched).length;
    const killSwitchedCount = configs.filter((c) => c.killSwitched).length;

    // Hourly telemetry timeseries for the last 24 hours
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const hourlyData = await EvaluationMetric.aggregate([
      {
        $match: {
          environmentId: { $in: envIds },
          hour: { $gte: since },
        },
      },
      {
        $group: {
          _id: { hour: '$hour', environmentId: '$environmentId' },
          evaluations: { $sum: '$totalEvaluations' },
          trueCount: { $sum: '$evalTrueCount' },
          falseCount: { $sum: '$evalFalseCount' },
        },
      },
      {
        $sort: { '_id.hour': 1 },
      },
    ]);

    const timeseries = hourlyData.map((item) => {
      const env = environments.find((e) => e._id.toString() === item._id.environmentId.toString());
      return {
        timestamp: item._id.hour,
        environmentName: env?.name || 'Unknown',
        evaluations: item.evaluations,
        trueCount: item.trueCount,
        falseCount: item.falseCount,
      };
    });

    const recentLogs = await AuditLog.find({ projectId: projObjId })
      .sort({ createdAt: -1 })
      .limit(10);

    return {
      flagCount: flags.length,
      environmentCount: environments.length,
      activeConfigsCount: activeCount,
      killSwitchedCount,
      timeseries,
      recentLogs,
    };
  }

  /**
   * Paginated query for organization audit logs.
   */
  static async queryAuditLogs(
    organizationId: string,
    options: {
      page?: number;
      limit?: number;
      entityType?: string;
      action?: string;
    }
  ): Promise<{ logs: any[]; total: number; page: number; totalPages: number }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const filter: any = { organizationId: new Types.ObjectId(organizationId) };
    if (options.entityType) {
      filter.entityType = options.entityType;
    }
    if (options.action) {
      filter.action = options.action;
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      AuditLog.countDocuments(filter),
    ]);

    return {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
