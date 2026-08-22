import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import paymentRoutes from './payment.routes.js';
import mediaRoutes from './media.routes.js';
import institutionRoutes from './institution.routes.js';
import courseRoutes from './course.routes.js';
import moduleRoutes from './module.routes.js';
import lessonRoutes from './lesson.routes.js';
import learningRoutes from './learning.routes.js';
import aiTutorRoutes from './ai-tutor.routes.js';
import checkoutRoutes from './checkout.routes.js';
import libraryRoutes from './library.routes.js';
import analyticsRoutes from './analytics.routes.js';
import { authLimiter } from '../utils/rateLimit.js';

import { Router } from 'express';

const router = Router();
router.use('/auth', authLimiter, authRoutes);
router.use('/users', userRoutes);
router.use('/payments', paymentRoutes);
router.use('/media', mediaRoutes);
router.use('/institutions', institutionRoutes);
router.use('/courses', courseRoutes);
router.use('/modules', moduleRoutes);
router.use('/lessons', lessonRoutes);
router.use('/', learningRoutes);
router.use('/courses', aiTutorRoutes);
router.use('/courses', checkoutRoutes);
router.use('/library', libraryRoutes);
router.use('/', analyticsRoutes);

export default router;
