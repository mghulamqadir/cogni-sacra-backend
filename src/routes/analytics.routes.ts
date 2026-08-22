import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { UserRole, type AuthRequest } from '../types/index.js';
import * as s from '../services/analytics.service.js';
const r = Router();
r.use(authenticate);
const a = (req: Parameters<typeof authenticate>[0]) => (req as AuthRequest).user;
r.get(
  '/instructor/courses/:id/analytics',
  authorize(UserRole.Instructor),
  asyncHandler(async (req, res) =>
    sendSuccess(res, 'Analytics fetched', await s.courseAnalytics(a(req), String(req.params['id'])))
  )
);
r.get(
  '/institutions/:id/analytics',
  authorize(UserRole.PlatformAdmin, UserRole.InstitutionAdmin),
  asyncHandler(async (req, res) =>
    sendSuccess(
      res,
      'Analytics fetched',
      await s.institutionAnalytics(a(req), String(req.params['id']))
    )
  )
);
r.get(
  '/learner/courses/:id/summary',
  authorize(UserRole.Learner, UserRole.IndependentLearner),
  asyncHandler(async (req, res) =>
    sendSuccess(res, 'Summary fetched', await s.learnerSummary(a(req), String(req.params['id'])))
  )
);
export default r;
