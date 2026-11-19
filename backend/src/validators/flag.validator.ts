import { z } from 'zod';

export const conditionSchema = z.object({
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

export const ruleSchema = z.object({
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
