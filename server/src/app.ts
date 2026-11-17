import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { config } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { NotFoundError } from './utils/errors.js';
import authRoutes from './routes/auth.routes.js';
import organizationRoutes from './routes/organization.routes.js';

export function createApp(): Express {
  const app = express();

  // Security Middlewares
  app.use(helmet());
  app.use(
    cors({
      origin: config.CORS_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Environment-Key'],
    })
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Global Rate Limiting in non-test environments
  if (config.NODE_ENV !== 'test') {
    const limiter = rateLimit({
      windowMs: config.RATE_LIMIT_WINDOW_MS,
      max: config.RATE_LIMIT_MAX_REQUESTS,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        error: { message: 'Too many requests, please try again later.' },
      },
    });
    app.use('/api', limiter);
  }

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      service: 'flagforge-api',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Root route
  app.get('/', (_req: Request, res: Response) => {
    res.status(200).json({
      name: 'FlagForge API',
      version: '1.0.0',
      docs: '/api/docs',
      health: '/health',
    });
  });

  // Mount API modules
  app.use(`${config.API_PREFIX}/auth`, authRoutes);
  app.use(`${config.API_PREFIX}/organizations`, organizationRoutes);

  // 404 Catch-All
  app.use((_req: Request, _res: Response, next) => {
    next(new NotFoundError('The requested endpoint does not exist.'));
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
