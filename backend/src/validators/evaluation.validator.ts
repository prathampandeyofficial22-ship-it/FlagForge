import { z } from 'zod';

export const evaluateSchema = z.object({
  body: z.object({
    flagKey: z.string().min(1, 'flagKey is required'),
    user: z
      .object({
        key: z.string().min(1, 'User key is required'),
        attributes: z.record(z.any()).optional(),
      })
      .optional(),
  }),
});

export const evaluateBatchSchema = z.object({
  body: z.object({
    flagKeys: z.array(z.string()).optional(),
    user: z
      .object({
        key: z.string().min(1, 'User key is required'),
        attributes: z.record(z.any()).optional(),
      })
      .optional(),
  }),
});
