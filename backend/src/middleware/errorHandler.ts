import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Operational AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  // Zod Validation Error
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    res.status(422).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: formattedErrors,
      },
    });
    return;
  }

  // MongoDB Unique Compound Index Conflict (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'resource';
    res.status(409).json({
      success: false,
      error: {
        message: `A resource with this ${field} already exists.`,
        details: err.keyValue,
      },
    });
    return;
  }

  // MongoDB Cast Error (invalid ObjectId)
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      error: {
        message: `Invalid format for parameter: ${err.path}`,
      },
    });
    return;
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: {
        message: 'Invalid authorization token',
      },
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: {
        message: 'Authorization token has expired',
      },
    });
    return;
  }

  // Unexpected internal server error
  logger.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
    },
  });
}
