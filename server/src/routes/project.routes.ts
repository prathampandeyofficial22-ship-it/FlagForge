import { Router } from 'express';
import {
  ProjectController,
  createProjectSchema,
  updateProjectSchema,
} from '../controllers/project.controller.js';
import {
  EnvironmentController,
  createEnvSchema,
} from '../controllers/environment.controller.js';
import {
  FlagController,
  createFlagSchema,
} from '../controllers/flag.controller.js';
import { AnalyticsController } from '../controllers/analytics.controller.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

// Project operations
router.get('/:projectId', ProjectController.getOne);
router.patch('/:projectId', validate(updateProjectSchema), ProjectController.update);
router.delete('/:projectId', ProjectController.delete);
router.get('/:projectId/analytics', AnalyticsController.getProjectAnalytics);

// Environment operations under project
router.get('/:projectId/environments', EnvironmentController.list);
router.post(
  '/:projectId/environments',
  validate(createEnvSchema),
  EnvironmentController.create
);

// Feature Flag operations under project
router.get('/:projectId/flags', FlagController.list);
router.post(
  '/:projectId/flags',
  validate(createFlagSchema),
  FlagController.create
);

export default router;
