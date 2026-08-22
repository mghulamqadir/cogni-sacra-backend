import { Router } from 'express';
import { validate, validateQuery } from '../middlewares/validate.js';
import { authenticate, authorizeRoles } from '../middlewares/authenticate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { UserRole } from '../types/index.js';
import { updateProfileSchema, listUsersQuerySchema } from '../validations/user.validation.js';
import * as userController from '../controllers/user.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Current user
router.get('/me', asyncHandler(userController.getProfile));
router.patch('/me', validate(updateProfileSchema), asyncHandler(userController.updateProfile));

// Admin only
router.get(
  '/',
  authorizeRoles(UserRole.PlatformAdmin),
  validateQuery(listUsersQuerySchema),
  asyncHandler(userController.listUsers)
);

router.get(
  '/:id',
  authorizeRoles(UserRole.PlatformAdmin),
  asyncHandler(userController.getUserById)
);

router.delete(
  '/:id',
  authorizeRoles(UserRole.PlatformAdmin),
  asyncHandler(userController.deleteUser)
);

export default router;
