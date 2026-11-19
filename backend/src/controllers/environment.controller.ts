import { Request, Response, NextFunction } from 'express';
import { EnvironmentService } from '../services/environment.service.js';

export { createEnvSchema } from '../validators/environment.validator.js';

export class EnvironmentController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const environments = await EnvironmentService.listEnvironments(req.params.projectId as string);
      res.status(200).json({
        success: true,
        data: environments,
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await EnvironmentService.createEnvironment(
        req.params.projectId as string,
        req.user!.id,
        req.body
      );
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async rotateKeys(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await EnvironmentService.rotateKeys(
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
