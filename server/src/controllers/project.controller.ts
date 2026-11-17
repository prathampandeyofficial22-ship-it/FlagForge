import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ProjectService } from '../services/project.service.js';

export const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Project name must be at least 2 characters'),
    key: z.string().regex(/^[a-z0-9-]+$/, 'Key must be lowercase alphanumeric with hyphens').optional(),
    description: z.string().optional(),
  }),
});

export const updateProjectSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Project name must be at least 2 characters').optional(),
    description: z.string().optional(),
  }),
});

export class ProjectController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.params.orgId || req.organizationId!;
      const result = await ProjectService.createProject(orgId, req.user!.id, req.body);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.params.orgId || req.organizationId!;
      const projects = await ProjectService.listProjects(orgId);
      res.status(200).json({
        success: true,
        data: projects,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const project = await ProjectService.getProjectById(req.params.projectId);
      res.status(200).json({
        success: true,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const project = await ProjectService.updateProject(req.params.projectId, req.user!.id, req.body);
      res.status(200).json({
        success: true,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await ProjectService.deleteProject(req.params.projectId, req.user!.id);
      res.status(200).json({
        success: true,
        data: { message: 'Project and all associated resources deleted successfully' },
      });
    } catch (error) {
      next(error);
    }
  }
}
