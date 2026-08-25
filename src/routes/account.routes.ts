import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/authenticate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { updateProfileSchema, onboardingSchema } from '../validations/user.validation.js';
import * as userController from '../controllers/user.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(userController.getProfile));
router.patch('/', validate(updateProfileSchema), asyncHandler(userController.updateProfile));
router.post('/onboarding', validate(onboardingSchema), asyncHandler(userController.completeOnboarding));

export default router;
