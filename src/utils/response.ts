import type { Response } from 'express';
import type { ApiResponse } from '../types/index.js';

export function sendSuccess<T>(res: Response, message: string, data?: T, statusCode = 200): void {
  const body: ApiResponse<T> = { success: true, message, data };
  res.status(statusCode).json(body);
}

export function sendCreated<T>(res: Response, message: string, data?: T): void {
  sendSuccess(res, message, data, 201);
}
