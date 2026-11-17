import { Request, Response, NextFunction } from 'express';
import { hashToken } from '../utils/hashing.js';
import { EnvironmentService } from '../services/environment.service.js';
import { IEnvironment } from '../models/Environment.js';
import { UnauthorizedError } from '../utils/errors.js';

declare global {
  namespace Express {
    interface Request {
      environment?: IEnvironment;
      isServerSdk?: boolean;
    }
  }
}

export async function requireSdkKey(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let rawKey = req.headers['x-environment-key'] as string;

    if (!rawKey && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && (parts[0] === 'Bearer' || parts[0] === 'ApiKey')) {
        rawKey = parts[1];
      }
    }

    if (!rawKey) {
      throw new UnauthorizedError('Missing SDK API key. Provide via X-Environment-Key header or Authorization header.');
    }

    const hashedKey = hashToken(rawKey);
    const environment = await EnvironmentService.getByApiKeyHash(hashedKey);

    if (!environment) {
      throw new UnauthorizedError('Invalid or revoked SDK API key.');
    }

    req.environment = environment;
    req.isServerSdk = rawKey.startsWith('ff_server_');

    next();
  } catch (error) {
    next(error);
  }
}
