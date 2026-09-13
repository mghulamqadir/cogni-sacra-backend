import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import { institutionScope } from '../middlewares/institutionScope.js';
import { authorize } from '../middlewares/authorize.js';
import { validateQuery } from '../middlewares/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { UserRole } from '../types/index.js';
import { instructorCourseQuery } from '../validations/course.validation.js';
import * as courseController from '../controllers/course.controller.js';

const router = Router();

router.use(authenticate, institutionScope, authorize(UserRole.Instructor, UserRole.IndependentInstructor));
router.get('/courses', validateQuery(instructorCourseQuery), asyncHandler(courseController.mine));

export default router;
