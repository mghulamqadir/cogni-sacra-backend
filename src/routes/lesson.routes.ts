import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import { institutionScope } from '../middlewares/institutionScope.js';
import { authorize } from '../middlewares/authorize.js';
import { validate } from '../middlewares/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { UserRole } from '../types/index.js';
import * as c from '../controllers/course.controller.js';
import { lessonUpdate } from '../validations/course.validation.js';
const r = Router();
r.use(authenticate, institutionScope);
r.patch(
  '/:id',
  authorize(UserRole.PlatformAdmin, UserRole.Instructor),
  validate(lessonUpdate),
  asyncHandler(c.updateLesson)
);
r.delete(
  '/:id',
  authorize(UserRole.PlatformAdmin, UserRole.Instructor),
  asyncHandler(c.deleteLesson)
);
export default r;
