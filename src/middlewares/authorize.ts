import type { NextFunction, Request, Response } from 'express';
import type { AuthRequest, UserRole } from '../types/index.js';
import { AppError } from '../utils/AppError.js';

export const authorize =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!roles.includes((req as AuthRequest).user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403, 'FORBIDDEN')
      );
    }
    next();
  };
