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
  moduleUpdate,
  lessonInput,
  lessonUpdate,
  catalogQuery,
} from '../validations/course.validation.js';
const r = Router();
r.get('/public', validateQuery(catalogQuery), asyncHandler(c.catalog));
r.use(authenticate, institutionScope);
r.post(
  '/',
  authorize(UserRole.PlatformAdmin, UserRole.Instructor),
  validate(courseCreate),
  asyncHandler(c.create)
);
r.get('/:id', asyncHandler(c.get));
r.patch(
  '/:id',
  authorize(UserRole.PlatformAdmin, UserRole.Instructor),
  validate(courseUpdate),
  asyncHandler(c.update)
);
r.post(
  '/:id/publish',
  authorize(UserRole.PlatformAdmin, UserRole.Instructor),
  asyncHandler(c.publish)
);
r.post(
  '/:id/archive',
  authorize(UserRole.PlatformAdmin, UserRole.Instructor),
  asyncHandler(c.archive)
);
r.post(
  '/:id/request-publication',
  authorize(UserRole.PlatformAdmin, UserRole.Instructor),
  asyncHandler(c.requestPublic)
);
r.post(
  '/:id/approve-publication',
  authorize(UserRole.InstitutionAdmin),
  asyncHandler(c.approvePublic)
);
r.post(
  '/:courseId/modules',
  authorize(UserRole.PlatformAdmin, UserRole.Instructor),
  validate(moduleInput),
  asyncHandler(c.addModule)
);
export default r;
