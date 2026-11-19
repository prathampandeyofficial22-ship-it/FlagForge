import { Router } from 'express';
import {
  FlagController,
  updateFlagSchema,
  updateEnvConfigSchema,
} from '../controllers/flag.controller.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/:flagId', FlagController.getOne);
router.patch('/:flagId', validate(updateFlagSchema), FlagController.update);
router.delete('/:flagId', FlagController.archive);

// Environment flag configurations
router.get('/:flagId/environments/:envId', FlagController.getEnvironmentConfig);
router.put(
  '/:flagId/environments/:envId',
  validate(updateEnvConfigSchema),
  FlagController.updateEnvironmentConfig
);
router.post('/:flagId/environments/:envId/toggle', FlagController.toggle);
router.post('/:flagId/environments/:envId/kill-switch', FlagController.killSwitch);

export default router;
