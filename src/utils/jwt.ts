import jwt from 'jsonwebtoken';
import type { Secret, SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { JwtPayload, UserRole } from '../types/index.js';

function signToken(userId: string, email: string, role: UserRole): string {
  const payload: JwtPayload = { userId, email, role };
  const secret: Secret = env.JWT_SECRET;

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
  const secret: Secret = env.JWT_SECRET;

  // Email verification tokens expire in 10 minutes
  return jwt.sign(payload, secret, { expiresIn: '10m' });
}

export function verifyEmailToken(token: string): EmailVerificationPayload {
  const secret: Secret = env.JWT_SECRET;
  return jwt.verify(token, secret) as EmailVerificationPayload;
}

// ─── Password Reset Token ───────────────────────────────────────────────────

interface PasswordResetPayload {
  userId: string;
  email: string;
  type: 'password-reset';
}

function normalizeJwt(token: string): string {
  return token.trim().replace(/\\([_-])/g, '$1');
}

export function generatePasswordResetToken(userId: string, email: string): string {
  const payload: PasswordResetPayload = { userId, email, type: 'password-reset' };
  const secret: Secret = env.JWT_SECRET;

  // Password reset tokens expire in 10 minutes
  return jwt.sign(payload, secret, { expiresIn: '10m' });
}

export function verifyPasswordResetToken(token: string): PasswordResetPayload {
  const secret: Secret = env.JWT_SECRET;
  const payload = jwt.verify(normalizeJwt(token), secret) as Partial<PasswordResetPayload>;

  if (
    typeof payload.userId !== 'string' ||
    typeof payload.email !== 'string' ||
    payload.type !== 'password-reset'
  ) {
    throw new Error('Invalid password reset token payload');
  }

  return payload as PasswordResetPayload;
}

export default signToken;
