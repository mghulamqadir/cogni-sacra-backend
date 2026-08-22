import { Schema, model, type Types } from 'mongoose';
interface Resource {
  name: string;
  fileUrl: string;
  mimeType?: string;
  size?: number;
}
export interface ILesson {
  institutionId?: Types.ObjectId;
  courseId: Types.ObjectId;
  moduleId: Types.ObjectId;
  title: string;
  order: number;
  contentType: 'text' | 'video' | 'link';
  contentBody?: string;
  contentUrl?: string;
  aiContext?: string;
  plainTextForAI: string;
  resources: Resource[];
}
const resource = new Schema<Resource>(
  {
    name: { type: String, required: true },
    fileUrl: { type: String, required: true },
    mimeType: String,
    size: Number,
  },
  { _id: true }
);
const schema = new Schema<ILesson>(
  {
    institutionId: { type: Schema.Types.ObjectId, ref: 'Institution' },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    moduleId: { type: Schema.Types.ObjectId, ref: 'Module', required: true },
    title: { type: String, required: true },
    order: { type: Number, min: 0, required: true },
    contentType: { type: String, enum: ['text', 'video', 'link'], required: true },
    contentBody: String,
    contentUrl: String,
    aiContext: String,
    plainTextForAI: { type: String, required: true },
    resources: { type: [resource], default: [] },
  },
  { timestamps: true }
);
schema.index({ courseId: 1, moduleId: 1, order: 1 }, { unique: true });
schema.index({ institutionId: 1, courseId: 1 });
schema.pre('validate', function () {
  if (this.contentType === 'text') {
    if (!this.contentBody?.trim()) this.invalidate('contentBody', 'contentBody is required');
    this.contentUrl = undefined;
    this.aiContext = undefined;
  } else {
    if (!this.contentUrl?.trim()) this.invalidate('contentUrl', 'contentUrl is required');
    if (!this.aiContext?.trim()) this.invalidate('aiContext', 'aiContext is required');
    this.contentBody = undefined;
  }
  if (!this.plainTextForAI.trim())
    this.invalidate('plainTextForAI', 'AI grounding content is required');
});
export const Lesson = model<ILesson>('Lesson', schema);
