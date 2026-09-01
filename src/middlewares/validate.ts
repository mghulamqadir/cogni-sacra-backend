import type { Request, Response, NextFunction } from 'express';
import type { Schema } from 'joi';
import { AppError } from '../utils/AppError.js';

export function validate(schema: Schema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: false,
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
      allowUnknown: false,
    });

    if (error !== undefined) {
      const message = error.details.map((d) => d.message).join(', ');
      return next(new AppError(message, 422));
    }

    // Express 5 exposes req.query through a read-only getter. Mutate the
    // existing parsed object instead of assigning to the getter.
    const query = req.query as Record<string, unknown>;
    for (const key of Object.keys(query)) delete query[key];
    Object.assign(query, value as Record<string, unknown>);
    next();
  };
}
