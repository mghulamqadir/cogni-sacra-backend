import { Router } from 'express';
import Joi from 'joi';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { validate, validateQuery } from '../middlewares/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { UserRole, type AuthRequest } from '../types/index.js';
import { sendCreated, sendSuccess } from '../utils/response.js';
import * as s from '../services/library.service.js';
const schema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string(),
  authors: Joi.array().items(Joi.string()),
  subjects: Joi.array().items(Joi.string()),
  resourceType: Joi.string().valid('article', 'book', 'video', 'link', 'file').required(),
  url: Joi.string().uri(),
  fileUrl: Joi.string().uri(),
  aiSummary: Joi.string(),
});
const query = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().max(100),
});
const r = Router();
r.use(authenticate);
r.get(
  '/',
  validateQuery(query),
  asyncHandler(async (req, res) =>
    sendSuccess(
      res,
      'Library resources fetched',
      await s.list((req as AuthRequest).user, req.query as never)
    )
  )
);
r.post(
  '/',
  authorize(UserRole.PlatformAdmin, UserRole.InstitutionAdmin),
  validate(schema),
  asyncHandler(async (req, res) =>
    sendCreated(
      res,
      'Library resource created',
      await s.create((req as AuthRequest).user, req.body)
    )
  )
);
r.patch(
  '/:id',
  authorize(UserRole.PlatformAdmin, UserRole.InstitutionAdmin),
  validate(schema.fork(['title', 'resourceType'], (x) => x.optional())),
  asyncHandler(async (req, res) =>
    sendSuccess(
      res,
      'Library resource updated',
      await s.update((req as AuthRequest).user, String(req.params['id']), req.body)
    )
  )
);
r.delete(
  '/:id',
  authorize(UserRole.PlatformAdmin, UserRole.InstitutionAdmin),
  asyncHandler(async (req, res) => {
    await s.remove((req as AuthRequest).user, String(req.params['id']));
    sendSuccess(res, 'Library resource deleted');
  })
);
export default r;
