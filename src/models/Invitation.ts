import { Schema, model, type Types } from 'mongoose';

export interface IInvitation {
  institutionId: Types.ObjectId;
  email: string;
  role: 'institution_admin' | 'instructor' | 'learner';
  invitedByRole: 'platform_admin' | 'institution_admin';
  tokenHash: string;
  invitedBy: Types.ObjectId;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  expiresAt: Date;
  acceptedAt?: Date;
}
const schema = new Schema<IInvitation>(
  {
    institutionId: { type: Schema.Types.ObjectId, ref: 'Institution', required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, enum: ['institution_admin', 'instructor', 'learner'], required: true },
    invitedByRole: { type: String, enum: ['platform_admin', 'institution_admin'], required: true },
    tokenHash: { type: String, required: true, unique: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'expired', 'revoked'],
      default: 'pending',
    },
    expiresAt: { type: Date, required: true },
    acceptedAt: Date,
  },
  { timestamps: true }
);
schema.index({ institutionId: 1, email: 1, status: 1 });
schema.index(
  { institutionId: 1, role: 1 },
  { unique: true, partialFilterExpression: { role: 'institution_admin', status: 'pending' } }
);
export const Invitation = model<IInvitation>('Invitation', schema);
