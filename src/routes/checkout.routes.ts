import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { UserRole } from '../types/index.js';
import { checkout } from '../controllers/checkout.controller.js';
const r = Router();
r.post(
  '/:id/checkout',
  authenticate,
  authorize(UserRole.IndependentLearner),
  asyncHandler(checkout)
);
export default r;
