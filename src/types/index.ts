import type { Request } from 'express';
import type { Types } from 'mongoose';

// ─── API Response ─────────────────────────────────────────────────────────────

export interface ApiResponse<T = undefined> {
  success: boolean;
  message: string;
  data?: T;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export enum UserRole {
  User = 'user',
  Admin = 'admin',
}

export interface AuthenticatedUser {
  _id: Types.ObjectId;
  email: string;
  role: UserRole;
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
  CLIENT_URL: string;
  MONGO_URI: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
  BREVO_API_KEY: string;
  SENDER_EMAIL: string;
  SENDER_NAME: string;
}
