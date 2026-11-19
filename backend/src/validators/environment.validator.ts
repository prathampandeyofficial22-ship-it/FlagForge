import { z } from 'zod';

export const createEnvSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Environment name must be at least 2 characters'),
    key: z.string().regex(/^[a-z0-9-]+$/, 'Key must be lowercase alphanumeric with hyphens').optional(),
    type: z.enum(['development', 'staging', 'production', 'custom']).optional(),
  }),
});
