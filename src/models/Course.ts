import { Schema, model, type Types } from 'mongoose';

export interface ICourse {
  institutionId?: Types.ObjectId;
  instructorId?: Types.ObjectId;
  createdBy: Types.ObjectId;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  status: 'draft' | 'published' | 'archived';
  enrollmentMode: 'assigned_only' | 'self_enroll';
  visibility: 'private' | 'public_requested' | 'public';
  publicApprovedBy?: Types.ObjectId;
  publishedAt?: Date;
  priceAmount?: number;
  currency?: string;
}
const schema = new Schema<ICourse>(
  {
    institutionId: { type: Schema.Types.ObjectId, ref: 'Institution' },
    instructorId: { type: Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: String,
    thumbnailUrl: String,
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
    enrollmentMode: {
      type: String,
      enum: ['assigned_only', 'self_enroll'],
      default: 'assigned_only',
    },
    visibility: {
      type: String,
      enum: ['private', 'public_requested', 'public'],
      default: 'private',
    },
    publicApprovedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    publishedAt: Date,
    priceAmount: { type: Number, min: 0 },
    currency: { type: String, minlength: 3, maxlength: 3, uppercase: true },
  },
  { timestamps: true }
);
schema.index({ institutionId: 1, status: 1 });
schema.index({ institutionId: 1, instructorId: 1 });
schema.index({ visibility: 1, status: 1 });
schema.pre('validate', function () {
  if (this.institutionId == null && this.instructorId != null)
    this.invalidate('instructorId', 'Platform courses cannot have a tenant instructor');
  if ((this.priceAmount == null) !== (this.currency == null))
    this.invalidate('priceAmount', 'priceAmount and currency must be provided together');
});
export const Course = model<ICourse>('Course', schema);
