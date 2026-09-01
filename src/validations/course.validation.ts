import Joi from 'joi';
export const courseCreate = Joi.object({
  title: Joi.string().trim().min(2).max(160).required(),
  description: Joi.string().max(5000),
  thumbnailUrl: Joi.string().uri(),
  enrollmentMode: Joi.string()
    .valid('assigned_only', 'self_enroll', 'assigned_and_self_enroll')
    .default('assigned_only'),
  priceAmount: Joi.number().integer().min(0),
  currency: Joi.string().length(3).uppercase(),
}).custom((value, helpers) => {
  const hasPrice = value.priceAmount !== undefined;
  const hasCurrency = value.currency !== undefined;
  if (hasPrice !== hasCurrency) return helpers.error('any.custom');
  return value;
}).messages({ 'any.custom': 'priceAmount and currency must be provided together' });
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
  mediaKey: Joi.string().trim().max(300),
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
