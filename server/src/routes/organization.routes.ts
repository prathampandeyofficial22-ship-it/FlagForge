import { Router } from 'express';
import {
  OrganizationController,
  createOrgSchema,
  addMemberSchema,
  updateRoleSchema,
} from '../controllers/organization.controller.js';
import {
  ProjectController,
  createProjectSchema,
} from '../controllers/project.controller.js';
import { AnalyticsController } from '../controllers/analytics.controller.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

router.use(requireAuth);

router.post('/', validate(createOrgSchema), OrganizationController.create);
router.get('/', OrganizationController.listUserOrgs);

router.get('/:orgId', requireRole('viewer'), OrganizationController.getOne);
router.get('/:orgId/members', requireRole('viewer'), OrganizationController.listMembers);
router.post(
  '/:orgId/members',
  requireRole('admin'),
  validate(addMemberSchema),
  OrganizationController.addMember
);
router.patch(
  '/:orgId/members/:memberId',
  requireRole('admin'),
  validate(updateRoleSchema),
  OrganizationController.updateMemberRole
);
router.delete(
  '/:orgId/members/:memberId',
  requireRole('admin'),
  OrganizationController.removeMember
);

// Projects within organization
router.get('/:orgId/projects', requireRole('viewer'), ProjectController.list);
router.post(
  '/:orgId/projects',
  requireRole('developer'),
  validate(createProjectSchema),
  ProjectController.create
);

// Analytics & Audit Logs
router.get('/:orgId/analytics', requireRole('viewer'), AnalyticsController.getOrgAnalytics);
router.get('/:orgId/audit-logs', requireRole('viewer'), AnalyticsController.getAuditLogs);

export default router;
