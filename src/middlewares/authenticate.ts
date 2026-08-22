import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import type { AuthRequest, JwtPayload } from '../types/index.js';
import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';
import { Types } from 'mongoose';
import { User } from '../models/User.js';
import { UserStatus } from '../types/index.js';

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers['authorization'];

  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError('No token provided', 401));
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    const user = await User.findById(payload.userId).lean().exec();
    if (user === null || user.status === UserStatus.Suspended) {
      return next(new AppError('Account is unavailable', 401, 'ACCOUNT_UNAVAILABLE'));
    }
    (req as AuthRequest).user = {
      _id: new Types.ObjectId(payload.userId),
      email: user.email,
      role: user.role,
      institutionId: user.institutionId,
      status: user.status,
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
