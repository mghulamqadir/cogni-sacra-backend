import Joi from 'joi';

export const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80),
}).min(1);

export const listUsersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  role: Joi.string().valid('user', 'admin'),
  search: Joi.string().trim().max(100),
});
