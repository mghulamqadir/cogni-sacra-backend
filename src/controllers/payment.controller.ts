import type { Request, Response } from 'express';
import type { AuthRequest } from '../types/index.js';
import * as paymentService from '../services/payment.service.js';
import { sendCreated, sendSuccess } from '../utils/response.js';
import type { CreatePaymentIntentDto } from '../dtos/index.js';

export async function createPaymentIntent(req: Request, res: Response): Promise<void> {
  const { _id } = (req as AuthRequest).user;
  const dto = req.body as CreatePaymentIntentDto;
  const result = await paymentService.createPaymentIntent(_id.toString(), dto);
  sendCreated(res, 'Payment intent created', result);
}

export async function getMyPayments(req: Request, res: Response): Promise<void> {
  const { _id } = (req as AuthRequest).user;
  const payments = await paymentService.getPaymentsByUser(_id.toString());
  sendSuccess(res, 'Payments fetched', payments);
}
