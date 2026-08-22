import { Schema, model, type Types } from 'mongoose';
export interface IAiTutorMessage {
  institutionId?: Types.ObjectId;
  courseId: Types.ObjectId;
  learnerId: Types.ObjectId;
  question: string;
  answer: string;
  grounded: boolean;
  citedLessonIds: Types.ObjectId[];
  model: string;
  latencyMs: number;
  inputTokens?: number;
  outputTokens?: number;
}
const schema = new Schema<IAiTutorMessage>(
  {
    institutionId: { type: Schema.Types.ObjectId, ref: 'Institution' },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    learnerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    grounded: { type: Boolean, required: true },
    citedLessonIds: [{ type: Schema.Types.ObjectId, ref: 'Lesson' }],
    model: { type: String, required: true },
    latencyMs: { type: Number, required: true },
    inputTokens: Number,
    outputTokens: Number,
  },
  { timestamps: true }
);
schema.index({ courseId: 1, learnerId: 1, createdAt: -1 });
export const AiTutorMessage = model<IAiTutorMessage>('AiTutorMessage', schema);
