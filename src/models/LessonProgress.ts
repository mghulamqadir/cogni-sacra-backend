import { Schema, model, type Types } from 'mongoose';
export interface ILessonProgress {
  institutionId?: Types.ObjectId;
  enrollmentId: Types.ObjectId;
  courseId: Types.ObjectId;
  lessonId: Types.ObjectId;
  learnerId: Types.ObjectId;
  completedAt: Date;
}
const schema = new Schema<ILessonProgress>(
  {
    institutionId: { type: Schema.Types.ObjectId, ref: 'Institution' },
    enrollmentId: { type: Schema.Types.ObjectId, ref: 'Enrollment', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true },
    learnerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
schema.index({ enrollmentId: 1, lessonId: 1 }, { unique: true });
schema.index({ institutionId: 1, learnerId: 1 });
export const LessonProgress = model<ILessonProgress>('LessonProgress', schema);
