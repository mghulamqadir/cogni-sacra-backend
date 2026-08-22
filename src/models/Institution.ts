import { Schema, model, type Types } from 'mongoose';

export interface IInstitution {
  name: string;
  slug: string;
  logoUrl?: string;
  createdBy: Types.ObjectId;
  status: 'pending' | 'approved' | 'suspended';
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
const schema = new Schema<IInstitution>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    logoUrl: String,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'suspended'],
      default: 'pending',
      index: true,
    },
    approvedAt: Date,
  },
  { timestamps: true }
);
export const Institution = model<IInstitution>('Institution', schema);
