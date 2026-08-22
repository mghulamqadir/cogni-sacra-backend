import Joi from 'joi';
export const assignSchema = Joi.object({ learnerId: Joi.string().hex().length(24).required() });
export const assessmentSchema = Joi.object({
  title: Joi.string().min(1).max(160).required(),
  lessonId: Joi.string().hex().length(24),
  passingScorePercent: Joi.number().min(0).max(100).default(60),
  maxAttempts: Joi.number().integer().min(1).max(20).default(1),
  questions: Joi.array()
    .min(1)
    .items(
      Joi.object({
        text: Joi.string().required(),
        options: Joi.array().min(2).items(Joi.string().required()).required(),
        correctOptionIndex: Joi.number().integer().min(0).required(),
      })
    )
    .required(),
});
export const submitSchema = Joi.object({
  answers: Joi.array().items(Joi.number().integer().min(0)).required(),
});
