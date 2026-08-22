import { Schema, model } from 'mongoose';
import type { Document, Types } from 'mongoose';
import { UserRole, UserStatus } from '../types/index.js';

// ─── Document interface ───────────────────────────────────────────────────────

export interface IUser {
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  role: UserRole;
  institutionId?: Types.ObjectId;
  status: UserStatus;
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
      minlength: 8,
      select: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.IndependentLearner,
    },
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.Active,
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

userSchema.index({ institutionId: 1, role: 1 });
userSchema.index(
  { institutionId: 1, role: 1 },
  {
    unique: true,
    partialFilterExpression: { role: UserRole.InstitutionAdmin, status: UserStatus.Active },
  }
);
userSchema.pre('validate', function validateTenantInvariant() {
  const tenantRole = [UserRole.InstitutionAdmin, UserRole.Instructor, UserRole.Learner].includes(
    this.role
  );
  if (tenantRole && this.status !== UserStatus.PendingInstitution && this.institutionId == null) {
    this.invalidate('institutionId', 'institutionId is required for provisioned tenant users');
  }
  if ([UserRole.PlatformAdmin, UserRole.IndependentLearner].includes(this.role)) {
    this.institutionId = undefined;
  }
});

export const User = model<IUserDocument>('User', userSchema);
