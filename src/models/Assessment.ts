import { Schema, model, type Types } from 'mongoose';
interface Question {
  text: string;
  options: string[];
  correctOptionIndex: number;
}
export interface IAssessment {
  institutionId?: Types.ObjectId;
  courseId: Types.ObjectId;
  lessonId?: Types.ObjectId;
  title: string;
  passingScorePercent: number;
  maxAttempts: number;
  questions: Question[];
}
const question = new Schema<Question>(
  {
    text: { type: String, required: true },
    options: { type: [String], required: true, validate: (v: string[]) => v.length >= 2 },
    correctOptionIndex: { type: Number, required: true, min: 0 },
  },
  { _id: true }
);
const schema = new Schema<IAssessment>(
  {
    institutionId: { type: Schema.Types.ObjectId, ref: 'Institution' },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson' },
    title: { type: String, required: true },
    passingScorePercent: { type: Number, min: 0, max: 100, default: 60 },
    maxAttempts: { type: Number, min: 1, default: 1 },
    questions: { type: [question], validate: (v: Question[]) => v.length > 0 },
  },
  { timestamps: true }
);
schema.index({ institutionId: 1, courseId: 1 });
schema.pre('validate', function () {
  this.questions.forEach((q, index) => {
    if (q.correctOptionIndex >= q.options.length)
      this.invalidate(
        `questions.${index}.correctOptionIndex`,
        'correctOptionIndex is outside the options array'
      );
  });
});
export const Assessment = model<IAssessment>('Assessment', schema);
