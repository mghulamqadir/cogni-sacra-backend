import { Schema, model, type Types } from 'mongoose';
export interface IModule {
  institutionId?: Types.ObjectId;
  courseId: Types.ObjectId;
  title: string;
  order: number;
}
const schema = new Schema<IModule>(
  {
    institutionId: { type: Schema.Types.ObjectId, ref: 'Institution' },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true, trim: true },
    order: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);
schema.index({ courseId: 1, order: 1 }, { unique: true });
schema.index({ institutionId: 1, courseId: 1 });
export const CourseModule = model<IModule>('Module', schema);
