import { Request, Response, NextFunction } from 'express';
import { FlagService } from '../services/flag.service.js';

export {
  conditionSchema,
  ruleSchema,
  createFlagSchema,
  updateFlagSchema,
  updateEnvConfigSchema,
} from '../validators/flag.validator.js';

export class FlagController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const flag = await FlagService.createFlag(
        req.params.projectId as string,
        req.user!.id,
        req.body
      );
      res.status(201).json({
        success: true,
        data: flag,
      });
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const flags = await FlagService.listFlags(req.params.projectId as string);
      res.status(200).json({
        success: true,
        data: flags,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const flag = await FlagService.getFlagDetail(req.params.flagId as string);
      res.status(200).json({
        success: true,
        data: flag,
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const flag = await FlagService.updateFlag(
        req.params.flagId as string,
        req.user!.id,
        req.body
      );
      res.status(200).json({
        success: true,
        data: flag,
      });
    } catch (error) {
      next(error);
    }
  }

  static async archive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await FlagService.archiveFlag(req.params.flagId as string, req.user!.id);
      res.status(200).json({
        success: true,
        data: { message: 'Feature flag archived successfully' },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getEnvironmentConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const config = await FlagService.getEnvironmentConfig(
        req.params.flagId as string,
        req.params.envId as string
      );
      res.status(200).json({
        success: true,
        data: config,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateEnvironmentConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const config = await FlagService.updateEnvironmentConfig(
        req.params.flagId as string,
        req.params.envId as string,
        req.user!.id,
        req.body
      );
      res.status(200).json({
        success: true,
        data: config,
      });
    } catch (error) {
      next(error);
    }
  }

  static async toggle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await FlagService.toggleFlag(
        req.params.flagId as string,
        req.params.envId as string,
        req.user!.id
      );
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async killSwitch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await FlagService.triggerKillSwitch(
        req.params.flagId as string,
        req.params.envId as string,
        req.user!.id
      );
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
