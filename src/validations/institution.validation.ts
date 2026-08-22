import Joi from 'joi';
import { UserRole, UserStatus } from '../types/index.js';
export const createInstitutionSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  slug: Joi.string().trim().min(2).max(80).required(),
  logoUrl: Joi.string().uri(),
});
export const inviteMemberSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  role: Joi.string()
    .valid(UserRole.InstitutionAdmin, UserRole.Instructor, UserRole.Learner)
    .required(),
});
export const memberListSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  role: Joi.string().valid(UserRole.InstitutionAdmin, UserRole.Instructor, UserRole.Learner),
  status: Joi.string().valid(...Object.values(UserStatus)),
  search: Joi.string().trim().max(100),
});
