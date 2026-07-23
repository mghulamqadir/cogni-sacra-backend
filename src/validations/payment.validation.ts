import Joi from 'joi';

export const createPaymentIntentSchema = Joi.object({
  amount: Joi.number().integer().min(50).required(), // amount in cents
  currency: Joi.string().length(3).lowercase().default('usd'),
  metadata: Joi.object().pattern(Joi.string(), Joi.string()),
});
