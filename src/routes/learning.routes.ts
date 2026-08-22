import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import { institutionScope } from '../middlewares/institutionScope.js';
import { authorize } from '../middlewares/authorize.js';
import { validate } from '../middlewares/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { UserRole } from '../types/index.js';
import * as c from '../controllers/learning.controller.js';
import {
  assignSchema,
  assessmentSchema,
  submitSchema,
} from '../validations/learning.validation.js';
const r = Router();
r.use(authenticate, institutionScope);
const learners = authorize(UserRole.Learner, UserRole.IndependentLearner);
r.post(
  '/courses/:id/assign',
  authorize(UserRole.InstitutionAdmin, UserRole.Instructor),
  validate(assignSchema),
  asyncHandler(c.assign)
);
r.post('/courses/:id/enroll', learners, asyncHandler(c.enroll));
r.get('/learner/courses', learners, asyncHandler(c.courses));
r.get('/courses/:courseId/lessons/:lessonId', learners, asyncHandler(c.lesson));
r.post('/lessons/:id/complete', learners, asyncHandler(c.complete));
r.get('/learner/courses/:courseId/progress', learners, asyncHandler(c.progress));
r.post(
  '/courses/:courseId/assessments',
  authorize(UserRole.Instructor),
  validate(assessmentSchema),
  asyncHandler(c.createAssessment)
);
r.get('/assessments/:id', asyncHandler(c.assessment));
r.post('/assessments/:id/submit', learners, validate(submitSchema), asyncHandler(c.submit));
r.get('/assessments/:id/results/me', learners, asyncHandler(c.results));
export default r;
