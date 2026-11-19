import { Router } from 'express';
import { EnvironmentController } from '../controllers/environment.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

// Key rotation
router.post('/:envId/rotate-keys', EnvironmentController.rotateKeys);

export default router;
