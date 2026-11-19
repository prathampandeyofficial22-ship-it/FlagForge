import { z } from 'zod';

export const createOrgSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Organization name must be at least 2 characters'),
  }),
});

export const addMemberSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    role: z.enum(['owner', 'admin', 'developer', 'viewer']).default('developer'),
  }),
});

export const updateRoleSchema = z.object({
  body: z.object({
    role: z.enum(['owner', 'admin', 'developer', 'viewer']),
  }),
});
