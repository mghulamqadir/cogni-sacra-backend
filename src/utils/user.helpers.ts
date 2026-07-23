import bcrypt from 'bcryptjs';
import type { UserDto, UserListItem } from '../dtos/index.js';
import type { UserRole } from '../types/index.js';
import { AppError } from './AppError.js';

type UserIdentity = {
  _id: { toString(): string };
  name: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
};

type UserListIdentity = UserIdentity & {
  createdAt: Date;
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(candidate: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(candidate, hashed);
}

export function assertPasswordsMatch(password: string, confirmPassword: string): void {
  if (password !== confirmPassword) {
    throw new AppError('Passwords do not match', 400);
  }
}

export function buildClientTokenUrl(baseUrl: string, path: string, token: string): string {
  return `${baseUrl}/${path}?token=${token}`;
}

export function toUserDto(doc: UserIdentity): UserDto {
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    role: doc.role,
    isEmailVerified: doc.isEmailVerified,
  };
}

export function toUserListItem(doc: UserListIdentity): UserListItem {
  return {
    ...toUserDto(doc),
    createdAt: doc.createdAt,
  };
}
