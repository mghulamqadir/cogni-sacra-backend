import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import paymentRoutes from './payment.routes.js';
import mediaRoutes from './media.routes.js';
import { authLimiter } from '../utils/rateLimit.js';

import { Router } from 'express';

const router = Router();
router.use('/auth', authLimiter, authRoutes);
router.use('/users', userRoutes);
router.use('/payments', paymentRoutes);
router.use('/media', mediaRoutes);

export default router;
