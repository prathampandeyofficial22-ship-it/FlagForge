import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { FlagService } from '../services/flag.service.js';

const conditionSchema = z.object({
  attribute: z.string().min(1),
  operator: z.enum([
    'equals',
    'notEquals',
    'contains',
    'notContains',
    'startsWith',
    'endsWith',
    'greaterThan',
    'lessThan',
    'greaterThanOrEqual',
    'lessThanOrEqual',
    'in',
    'notIn',
  ]),
  values: z.array(z.string()).min(1),
});

const ruleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  priority: z.number().int().min(0).default(0),
  conditions: z.array(conditionSchema).min(1),
  conditionOperator: z.enum(['AND', 'OR']).default('AND'),
  serveValue: z.any().default(true),
  rolloutPercentage: z.number().min(0).max(100).optional(),
});

export const createFlagSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Flag name must be at least 2 characters'),
    key: z.string().regex(/^[a-z0-9-]+$/, 'Key must be lowercase letters, numbers, and hyphens'),
    description: z.string().optional(),
    type: z.enum(['boolean', 'string', 'number', 'json']).default('boolean'),
    tags: z.array(z.string()).optional(),
    initialEnabled: z.boolean().optional(),
  }),
});

export const updateFlagSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

export const updateEnvConfigSchema = z.object({
  body: z.object({
    enabled: z.boolean().optional(),
    defaultValue: z.any().optional(),
    rolloutPercentage: z.number().min(0).max(100).optional(),
    rules: z.array(ruleSchema).optional(),
  }),
});

export class FlagController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const flag = await FlagService.createFlag(
        req.params.projectId as string,
        req.user!.id,
        req.body
      );
      res.status(201).json({
        success: true,
        data: flag,
      });
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const flags = await FlagService.listFlags(req.params.projectId as string);
      res.status(200).json({
        success: true,
        data: flags,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const flag = await FlagService.getFlagDetail(req.params.flagId as string);
      res.status(200).json({
        success: true,
        data: flag,
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const flag = await FlagService.updateFlag(
        req.params.flagId as string,
        req.user!.id,
        req.body
      );
      res.status(200).json({
        success: true,
        data: flag,
      });
    } catch (error) {
      next(error);
    }
  }

  static async archive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await FlagService.archiveFlag(req.params.flagId as string, req.user!.id);
      res.status(200).json({
        success: true,
        data: { message: 'Feature flag archived successfully' },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getEnvironmentConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const config = await FlagService.getEnvironmentConfig(
        req.params.flagId as string,
        req.params.envId as string
      );
      res.status(200).json({
        success: true,
        data: config,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateEnvironmentConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const config = await FlagService.updateEnvironmentConfig(
        req.params.flagId as string,
        req.params.envId as string,
        req.user!.id,
        req.body
      );
      res.status(200).json({
        success: true,
        data: config,
      });
    } catch (error) {
      next(error);
    }
  }

  static async toggle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await FlagService.toggleFlag(
        req.params.flagId as string,
        req.params.envId as string,
        req.user!.id
      );
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async killSwitch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await FlagService.triggerKillSwitch(
        req.params.flagId as string,
        req.params.envId as string,
        req.user!.id
      );
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
