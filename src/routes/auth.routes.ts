import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/authenticate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validations/auth.validation.js';
import * as authController from '../controllers/auth.controller.js';

const router = Router();

router.post('/register', validate(registerSchema), asyncHandler(authController.register));
router.post('/login', validate(loginSchema), asyncHandler(authController.login));
router.get('/verify-email', asyncHandler(authController.verifyEmail));
router.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  asyncHandler(authController.forgotPassword)
);
router.post(
  '/reset-password',
  validate(resetPasswordSchema),
  asyncHandler(authController.resetPassword)
);

// Protected
router.get('/me', authenticate, asyncHandler(authController.getMe));
router.patch(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  asyncHandler(authController.changePassword)
);

export default router;
