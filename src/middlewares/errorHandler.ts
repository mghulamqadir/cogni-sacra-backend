import type { Request, Response, NextFunction } from 'express';
import type { ApiResponse } from '../types/index.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    const body: ApiResponse = { success: false, message: err.message };
    res.status(err.statusCode).json(body);
    return;
  }

  logger.error('Unhandled error', {
    err,
    method: req.method,
    path: req.path,
  });

  const message =
    env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error
        ? err.message
        : String(err);

  const body: ApiResponse = { success: false, message };
  res.status(500).json(body);
}
