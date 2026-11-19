import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';

export function validate(
  schema:
    | AnyZodObject
    | {
        body?: AnyZodObject;
        query?: AnyZodObject;
        params?: AnyZodObject;
      }
) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if ('parseAsync' in schema) {
        // Full object schema
        const parsed = (await schema.parseAsync({
          body: req.body,
          query: req.query,
          params: req.params,
        })) as any;
        if (parsed.body) req.body = parsed.body;
        if (parsed.query) req.query = parsed.query;
        if (parsed.params) req.params = parsed.params;
      } else {
        // Segmented schema
        if (schema.body) {
          req.body = await schema.body.parseAsync(req.body);
        }
        if (schema.query) {
          req.query = await schema.query.parseAsync(req.query);
        }
        if (schema.params) {
          req.params = await schema.params.parseAsync(req.params);
        }
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
