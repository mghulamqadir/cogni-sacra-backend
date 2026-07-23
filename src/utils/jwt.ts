import jwt from 'jsonwebtoken';
import type { Secret, SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { JwtPayload, UserRole } from '../types/index.js';

function signToken(userId: string, email: string, role: UserRole): string {
  const payload: JwtPayload = { userId, email, role };
  const secret: Secret = process.env.JWT_SECRET as Secret;

  const expiresIn = env.JWT_EXPIRES_IN as SignOptions['expiresIn'];

  return jwt.sign(payload, secret, { expiresIn });
}

// ─── Email Verification Token ─────────────────────────────────────────────────

interface EmailVerificationPayload {
  userId: string;
  email: string;
  type: 'email-verification';
}

export function generateEmailVerificationToken(userId: string, email: string): string {
  const payload: EmailVerificationPayload = { userId, email, type: 'email-verification' };
  const secret: Secret = process.env.JWT_SECRET as Secret;

  // Email verification tokens expire in 10 minutes
  return jwt.sign(payload, secret, { expiresIn: '10m' });
}

export function verifyEmailToken(token: string): EmailVerificationPayload {
  const secret: Secret = process.env.JWT_SECRET as Secret;
  return jwt.verify(token, secret) as EmailVerificationPayload;
}

// ─── Password Reset Token ───────────────────────────────────────────────────

interface PasswordResetPayload {
  userId: string;
  email: string;
  type: 'password-reset';
}

export function generatePasswordResetToken(userId: string, email: string): string {
  const payload: PasswordResetPayload = { userId, email, type: 'password-reset' };
  const secret: Secret = process.env.JWT_SECRET as Secret;

  // Password reset tokens expire in 10 minutes
  return jwt.sign(payload, secret, { expiresIn: '10m' });
}

export function verifyPasswordResetToken(token: string): PasswordResetPayload {
  const secret: Secret = process.env.JWT_SECRET as Secret;
  return jwt.verify(token, secret) as PasswordResetPayload;
}

export default signToken;
