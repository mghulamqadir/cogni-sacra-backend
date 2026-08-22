import { Schema, model, type Types } from 'mongoose';
export interface IEnrollment {
  institutionId?: Types.ObjectId;
  courseId: Types.ObjectId;
  learnerId: Types.ObjectId;
  assignedBy?: Types.ObjectId;
  source: 'assigned' | 'self' | 'paid';
  status: 'not_started' | 'in_progress' | 'completed';
  progressPercent: number;
  enrolledAt: Date;
  completedAt?: Date;
  stripeCheckoutSessionId?: string;
}
const schema = new Schema<IEnrollment>(
  {
    institutionId: { type: Schema.Types.ObjectId, ref: 'Institution' },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    learnerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    source: { type: String, enum: ['assigned', 'self', 'paid'], required: true },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started',
    },
    progressPercent: { type: Number, min: 0, max: 100, default: 0 },
    enrolledAt: { type: Date, default: Date.now },
    completedAt: Date,
    stripeCheckoutSessionId: { type: String, sparse: true, unique: true },
  },
  { timestamps: true }
);
schema.index({ courseId: 1, learnerId: 1 }, { unique: true });
schema.index({ institutionId: 1, learnerId: 1 });
export const Enrollment = model<IEnrollment>('Enrollment', schema);
