import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { EnvironmentService } from '../services/environment.service.js';

export const createEnvSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Environment name must be at least 2 characters'),
    key: z.string().regex(/^[a-z0-9-]+$/, 'Key must be lowercase alphanumeric with hyphens').optional(),
    type: z.enum(['development', 'staging', 'production', 'custom']).optional(),
  }),
});

export class EnvironmentController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const environments = await EnvironmentService.listEnvironments(req.params.projectId);
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
        req.params.projectId,
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
        req.params.envId,
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
