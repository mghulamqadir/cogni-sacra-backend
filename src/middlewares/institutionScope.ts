import type { NextFunction, Request, Response } from 'express';
import { UserRole, UserStatus } from '../types/index.js';
import type { AuthRequest } from '../types/index.js';
import { AppError } from '../utils/AppError.js';

export function institutionScope(req: Request, _res: Response, next: NextFunction): void {
  const user = (req as AuthRequest).user;
  if (user.status === UserStatus.PendingInstitution) {
    return next(new AppError('Account has not been provisioned', 403, 'ACCOUNT_NOT_PROVISIONED'));
  }
  if (
    user.role !== UserRole.PlatformAdmin &&
    user.role !== UserRole.IndependentLearner &&
    user.institutionId == null
  ) {
    return next(new AppError('Institution scope is required', 403, 'INSTITUTION_SCOPE_REQUIRED'));
  }
  next();
}
