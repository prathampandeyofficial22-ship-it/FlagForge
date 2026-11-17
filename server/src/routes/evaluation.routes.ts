import { Router } from 'express';
import {
  EvaluationController,
  evaluateSchema,
  evaluateBatchSchema,
} from '../controllers/evaluation.controller.js';
import { requireSdkKey } from '../middleware/sdkAuth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// SDK Key authentication required for external evaluations
router.use(requireSdkKey);

router.post('/', validate(evaluateSchema), EvaluationController.evaluate);
router.post('/batch', validate(evaluateBatchSchema), EvaluationController.evaluateBatch);

export default router;
