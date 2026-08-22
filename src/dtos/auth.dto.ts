import type { UserRole, UserStatus } from '../types/index.js';
import type { Types } from 'mongoose';

// ─── Request DTOs ─────────────────────────────────────────────────────────────

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface GoogleLoginDto {
  credential: string;
  password?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface AcceptInvitationDto {
  token: string;
  name: string;
  password: string;
}

// ─── Response DTOs ────────────────────────────────────────────────────────────

export interface UserDto {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
  status: UserStatus;
  institutionId?: Types.ObjectId;
}

export interface AuthResult {
  token: string;
  user: UserDto;
}

export interface RegisterResult {
  user: UserDto;
}
