import { Request, Response, NextFunction } from 'express';
import { OrganizationService } from '../services/organization.service.js';

export {
  createOrgSchema,
  addMemberSchema,
  updateRoleSchema,
} from '../validators/organization.validator.js';

export class OrganizationController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const org = await OrganizationService.createOrganization(req.user!.id, req.body.name);
      res.status(201).json({
        success: true,
        data: org,
      });
    } catch (error) {
      next(error);
    }
  }

  static async listUserOrgs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgs = await OrganizationService.listUserOrganizations(req.user!.id);
      res.status(200).json({
        success: true,
        data: orgs,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const org = await OrganizationService.getOrganization(req.params.orgId as string);
      res.status(200).json({
        success: true,
        data: org,
      });
    } catch (error) {
      next(error);
    }
  }

  static async listMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const members = await OrganizationService.listMembers(req.params.orgId as string);
      res.status(200).json({
        success: true,
        data: members,
      });
    } catch (error) {
      next(error);
    }
  }

  static async addMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const member = await OrganizationService.addMember(
        req.params.orgId as string,
        req.user!.id,
        req.body.email,
        req.body.role
      );
      res.status(201).json({
        success: true,
        data: member,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateMemberRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const member = await OrganizationService.updateMemberRole(
        req.params.orgId as string,
        req.user!.id,
        req.params.memberId as string,
        req.body.role
      );
      res.status(200).json({
        success: true,
        data: member,
      });
    } catch (error) {
      next(error);
    }
  }

  static async removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await OrganizationService.removeMember(
        req.params.orgId as string,
        req.user!.id,
        req.params.memberId as string
      );
      res.status(200).json({
        success: true,
        data: { message: 'Member removed successfully' },
      });
    } catch (error) {
      next(error);
    }
  }
}
