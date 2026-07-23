import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/authenticate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createPaymentIntentSchema } from '../validations/payment.validation.js';
import * as paymentController from '../controllers/payment.controller.js';

const router = Router();

router.use(authenticate);

router.post(
  '/create-intent',
  validate(createPaymentIntentSchema),
  asyncHandler(paymentController.createPaymentIntent)
);

router.get('/my-payments', asyncHandler(paymentController.getMyPayments));

export default router;
