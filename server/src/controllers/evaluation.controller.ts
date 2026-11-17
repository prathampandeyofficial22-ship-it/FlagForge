import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { EvaluationService } from '../services/evaluation.service.js';

export const evaluateSchema = z.object({
  body: z.object({
    flagKey: z.string().min(1, 'flagKey is required'),
    user: z
      .object({
        key: z.string().min(1, 'User key is required'),
        attributes: z.record(z.any()).optional(),
      })
      .optional(),
  }),
});

export const evaluateBatchSchema = z.object({
  body: z.object({
    flagKeys: z.array(z.string()).optional(),
    user: z
      .object({
        key: z.string().min(1, 'User key is required'),
        attributes: z.record(z.any()).optional(),
      })
      .optional(),
  }),
});

export class EvaluationController {
  static async evaluate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const environment = req.environment!;
      const result = await EvaluationService.evaluateFlag(
        environment._id.toString(),
        environment.projectId.toString(),
        req.body.flagKey,
        req.body.user
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async evaluateBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const environment = req.environment!;
      const results = await EvaluationService.evaluateBatch(
        environment._id.toString(),
        environment.projectId.toString(),
        req.body.flagKeys,
        req.body.user
      );

      res.status(200).json({
        flags: results,
      });
    } catch (error) {
      next(error);
    }
  }
}
