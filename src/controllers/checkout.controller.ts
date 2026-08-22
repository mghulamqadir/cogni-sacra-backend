import type { Request, Response } from 'express';
import type { AuthRequest } from '../types/index.js';
import { sendSuccess } from '../utils/response.js';
import { createCourseCheckout } from '../services/payment.service.js';
export async function checkout(req: Request, res: Response) {
  sendSuccess(
    res,
    'Checkout created',
    await createCourseCheckout((req as AuthRequest).user._id.toString(), String(req.params['id']))
  );
}
