import Joi from 'joi';
export const courseCreate = Joi.object({
  title: Joi.string().trim().min(2).max(160).required(),
  description: Joi.string().max(5000),
  thumbnailUrl: Joi.string().uri(),
  enrollmentMode: Joi.string().valid('assigned_only', 'self_enroll').default('assigned_only'),
  priceAmount: Joi.number().integer().min(0),
  currency: Joi.string()
    .length(3)
    .uppercase()
    .when('priceAmount', { is: Joi.exist(), then: Joi.required() }),
});
export const courseUpdate = courseCreate.fork(['title'], (s) => s.optional());
export const moduleInput = Joi.object({
  title: Joi.string().trim().min(1).max(160).required(),
  order: Joi.number().integer().min(0).required(),
});
export const moduleUpdate = moduleInput.fork(['title', 'order'], (s) => s.optional());
export const lessonInput = Joi.object({
  title: Joi.string().trim().min(1).max(160).required(),
  order: Joi.number().integer().min(0).required(),
  contentType: Joi.string().valid('text', 'video', 'link').required(),
  contentBody: Joi.string().when('contentType', {
    is: 'text',
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
  contentUrl: Joi.string()
    .uri()
    .when('contentType', { is: 'text', then: Joi.forbidden(), otherwise: Joi.required() }),
  aiContext: Joi.string()
    .min(1)
    .when('contentType', { is: 'text', then: Joi.forbidden(), otherwise: Joi.required() }),
});
export const lessonUpdate = lessonInput.fork(['title', 'order', 'contentType'], (s) =>
  s.optional()
);
export const catalogQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().max(100),
});
