import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { institutionScope } from '../middlewares/institutionScope.js';
import { validate, validateQuery } from '../middlewares/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { UserRole } from '../types/index.js';
import * as c from '../controllers/course.controller.js';
import {
  courseCreate,
  courseUpdate,
  moduleInput,
  catalogQuery,
  bulkCourseCreate,
} from '../validations/course.validation.js';
const router = Router();
router.get('/public', validateQuery(catalogQuery), asyncHandler(c.catalog));
router.use(authenticate, institutionScope);
router.post(
  '/bulk',
  authorize(UserRole.PlatformAdmin, UserRole.Instructor, UserRole.IndependentInstructor),
  validate(bulkCourseCreate),
  asyncHandler(c.bulkCreate)
);
router.post(
  '/',
  authorize(UserRole.PlatformAdmin, UserRole.Instructor, UserRole.IndependentInstructor),
  validate(courseCreate),
  asyncHandler(c.create)
);
router.get('/:id', asyncHandler(c.get));
router.patch(
  '/:id',
  authorize(UserRole.PlatformAdmin, UserRole.Instructor, UserRole.IndependentInstructor),
  validate(courseUpdate),
  asyncHandler(c.update)
);
router.post(
  '/:id/publish',
  authorize(UserRole.PlatformAdmin, UserRole.Instructor, UserRole.IndependentInstructor),
  asyncHandler(c.publish)
);
router.post(
  '/:id/archive',
  authorize(UserRole.PlatformAdmin, UserRole.Instructor, UserRole.IndependentInstructor),
  asyncHandler(c.archive)
);
router.post(
  '/:id/request-publication',
  authorize(UserRole.PlatformAdmin, UserRole.Instructor, UserRole.IndependentInstructor),
  asyncHandler(c.requestPublic)
);
router.post(
  '/:id/approve-publication',
  authorize(UserRole.InstitutionAdmin),
  asyncHandler(c.approvePublic)
);
router.post(
  '/:courseId/modules',
  authorize(UserRole.PlatformAdmin, UserRole.Instructor, UserRole.IndependentInstructor),
  validate(moduleInput),
  asyncHandler(c.addModule)
);
export default router;
