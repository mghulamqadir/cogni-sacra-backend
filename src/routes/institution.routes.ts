import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { institutionScope } from '../middlewares/institutionScope.js';
import { validate, validateQuery } from '../middlewares/validate.js';
import { UserRole } from '../types/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  createInstitutionSchema,
  inviteMemberSchema,
  memberListSchema,
} from '../validations/institution.validation.js';
import * as controller from '../controllers/institution.controller.js';
const router = Router();
router.use(authenticate, institutionScope);
router.post(
  '/',
  authorize(UserRole.PlatformAdmin),
  validate(createInstitutionSchema),
  asyncHandler(controller.create)
);
router.patch('/:id/approve', authorize(UserRole.PlatformAdmin), asyncHandler(controller.approve));
router.get(
  '/:id',
  authorize(UserRole.PlatformAdmin, UserRole.InstitutionAdmin),
  asyncHandler(controller.get)
);
router.post(
  '/:id/invitations',
  authorize(UserRole.PlatformAdmin, UserRole.InstitutionAdmin),
  validate(inviteMemberSchema),
  asyncHandler(controller.invite)
);
router.get(
  '/:id/members',
  authorize(UserRole.PlatformAdmin, UserRole.InstitutionAdmin),
  validateQuery(memberListSchema),
  asyncHandler(controller.members)
);
export default router;
