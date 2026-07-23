import type { Request, Response, NextFunction } from 'express';
import type { Schema } from 'joi';
import { AppError } from '../utils/AppError.js';

export function validate(schema: Schema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error !== undefined) {
      const message = error.details.map((d) => d.message).join(', ');
      return next(new AppError(message, 422));
    }

    req.body = value as unknown;
    next();
  };
}

export function validateQuery(schema: Schema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error !== undefined) {
      const message = error.details.map((d) => d.message).join(', ');
      return next(new AppError(message, 422));
    }

    req.query = value as Record<string, string>;
    next();
  };
}
