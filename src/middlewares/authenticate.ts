import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import type { AuthRequest, JwtPayload } from '../types/index.js';
import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';
import type { Types } from 'mongoose';

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];

  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError('No token provided', 401));
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    (req as AuthRequest).user = {
      _id: payload.userId as unknown as Types.ObjectId,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch {
    next(new AppError('Invalid or expired token', 401));
  }
}

export function authorizeRoles(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest;

    if (!roles.includes(authReq.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }

    next();
  };
}
