import type { Request } from 'express';
import type { Types } from 'mongoose';

// ─── API Response ─────────────────────────────────────────────────────────────

export interface ApiResponse<T = undefined> {
  success: boolean;
  message: string;
  data?: T;
  code?: string;
  requestId?: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export enum UserRole {
  PlatformAdmin = 'platform_admin',
  InstitutionAdmin = 'institution_admin',
  Instructor = 'instructor',
  Learner = 'learner',
  IndependentLearner = 'independent_learner',
}

export enum UserStatus {
  PendingInstitution = 'pending_institution',
  Invited = 'invited',
  Active = 'active',
  Suspended = 'suspended',
}

export interface AuthenticatedUser {
  _id: Types.ObjectId;
  email: string;
  role: UserRole;
  institutionId?: Types.ObjectId;
  status: UserStatus;
}

export interface AuthRequest extends Request {
  user: AuthenticatedUser;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// ─── Environment ──────────────────────────────────────────────────────────────

export interface AppEnv {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  SERVER_URL: string;
  CLIENT_URL: string;
  MONGO_URI: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  GOOGLE_CLIENT_ID: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
  BREVO_API_KEY: string;
  SENDER_EMAIL: string;
  SENDER_NAME: string;
  AI_PROVIDER: string;
  AI_API_KEY: string;
  AI_MODEL: string;
  AI_TUTOR_MAX_CONTEXT_TOKENS: number;
  AI_TUTOR_MAX_QUESTION_CHARS: number;
  AI_TUTOR_RATE_LIMIT_PER_HOUR: number;
  FEATURE_VIRTUAL_LIBRARY: boolean;
  FEATURE_PAID_ENROLLMENT: boolean;
  LOG_LEVEL: string;
}
