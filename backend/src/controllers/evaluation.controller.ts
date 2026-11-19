import { Request, Response, NextFunction } from 'express';
import { EvaluationService } from '../services/evaluation.service.js';

export { evaluateSchema, evaluateBatchSchema } from '../validators/evaluation.validator.js';

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
