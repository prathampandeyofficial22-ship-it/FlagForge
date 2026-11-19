import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { OrganizationMember, OrgRole } from '../models/OrganizationMember.js';
import { ForbiddenError, NotFoundError, UnauthorizedError } from '../utils/errors.js';

const ROLE_HIERARCHY: Record<OrgRole, number> = {
  owner: 4,
  admin: 3,
  developer: 2,
  viewer: 1,
};

export function requireRole(minimumRole: OrgRole) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      // Extract orgId from params, query, or headers
      const orgId =
        req.params.orgId ||
        req.params.organizationId ||
        (req.query.orgId as string) ||
        (req.headers['x-organization-id'] as string) ||
        req.body?.organizationId;

      if (!orgId) {
        throw new ForbiddenError('Organization context is required for this action');
      }

      if (!Types.ObjectId.isValid(orgId)) {
        throw new NotFoundError('Invalid organization identifier');
      }

      const membership = await OrganizationMember.findOne({
        organizationId: new Types.ObjectId(orgId),
        userId: new Types.ObjectId(req.user.id),
      });

      if (!membership) {
        throw new ForbiddenError('You are not a member of this organization');
      }

      const userRoleLevel = ROLE_HIERARCHY[membership.role];
      const requiredRoleLevel = ROLE_HIERARCHY[minimumRole];

      if (userRoleLevel < requiredRoleLevel) {
        throw new ForbiddenError(
          `Insufficient permissions. Requires '${minimumRole}' role, but your role is '${membership.role}'`
        );
      }

      // Attach org context to request
      req.organizationId = orgId;
      req.orgRole = membership.role;

      next();
    } catch (error) {
      next(error);
    }
  };
}
