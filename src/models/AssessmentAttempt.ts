import { Schema, model, type Types } from 'mongoose';
export interface IAssessmentAttempt {
  institutionId?: Types.ObjectId;
  assessmentId: Types.ObjectId;
  courseId: Types.ObjectId;
  learnerId: Types.ObjectId;
  attemptNumber: number;
  answers: number[];
  scorePercent: number;
  passed: boolean;
  submittedAt: Date;
}
const schema = new Schema<IAssessmentAttempt>(
  {
    institutionId: { type: Schema.Types.ObjectId, ref: 'Institution' },
    assessmentId: { type: Schema.Types.ObjectId, ref: 'Assessment', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    learnerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    attemptNumber: { type: Number, required: true },
    answers: { type: [Number], required: true },
    scorePercent: { type: Number, required: true },
    passed: { type: Boolean, required: true },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
schema.index({ assessmentId: 1, learnerId: 1, attemptNumber: 1 }, { unique: true });
export const AssessmentAttempt = model<IAssessmentAttempt>('AssessmentAttempt', schema);

const counterSchema = new Schema({
  assessmentId: { type: Schema.Types.ObjectId, required: true },
  learnerId: { type: Schema.Types.ObjectId, required: true },
  value: { type: Number, default: 0 },
});
counterSchema.index({ assessmentId: 1, learnerId: 1 }, { unique: true });
export const AssessmentAttemptCounter = model('AssessmentAttemptCounter', counterSchema);
