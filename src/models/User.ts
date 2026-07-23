import { Schema, model } from 'mongoose';
import type { Document, Types } from 'mongoose';
import { UserRole } from '../types/index.js';

// ─── Document interface ───────────────────────────────────────────────────────

export interface IUser {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  stripeCustomerId?: string;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends IUser, Document<Types.ObjectId> {}

// ─── Schema ───────────────────────────────────────────────────────────────────

const userSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.User,
    },
    stripeCustomerId: {
      type: String,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const User = model<IUserDocument>('User', userSchema);
