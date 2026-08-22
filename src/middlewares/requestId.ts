import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

export function requestId(req: Request, res: Response, next: NextFunction): void {
  req.id = req.header('x-request-id')?.slice(0, 128) || randomUUID();
  res.setHeader('x-request-id', req.id);
  next();
}
