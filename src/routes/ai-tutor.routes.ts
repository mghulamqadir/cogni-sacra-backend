import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import Joi from 'joi';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { validate } from '../middlewares/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { UserRole, type AuthRequest } from '../types/index.js';
import { env } from '../config/env.js';
import * as c from '../controllers/ai-tutor.controller.js';
const r = Router();
r.use(authenticate, authorize(UserRole.Learner, UserRole.IndependentLearner));
const limiter = rateLimit({
  windowMs: 3600000,
  limit: env.AI_TUTOR_RATE_LIMIT_PER_HOUR,
  keyGenerator: (req) => (req as AuthRequest).user._id.toString(),
  standardHeaders: true,
  legacyHeaders: false,
});
r.post(
  '/:id/ai-tutor/ask',
  limiter,
  validate(
    Joi.object({ question: Joi.string().trim().max(env.AI_TUTOR_MAX_QUESTION_CHARS).required() })
  ),
  asyncHandler(c.ask)
);
r.get('/:id/ai-tutor/history', asyncHandler(c.history));
export default r;
