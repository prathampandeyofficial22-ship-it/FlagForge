import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics.service.js';

export class AnalyticsController {
  static async getOrgAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req.params.orgId as string) || req.organizationId!;
      const data = await AnalyticsService.getOrganizationAnalytics(orgId);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProjectAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = req.params.projectId as string;
      const data = await AnalyticsService.getProjectAnalytics(projectId);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req.params.orgId as string) || req.organizationId!;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const entityType = req.query.entityType as string;
      const action = req.query.action as string;

      const result = await AnalyticsService.queryAuditLogs(orgId, {
        page,
        limit,
        entityType,
        action,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
