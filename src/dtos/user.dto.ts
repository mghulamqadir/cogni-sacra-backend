import type { UserRole } from '../types/index.js';

// ─── Request DTOs ─────────────────────────────────────────────────────────────

export interface UpdateProfileDto {
  name?: string;
}

export interface ListUsersQuery {
  page: number;
  limit: number;
  role?: string;
  search?: string;
}

// ─── Response DTOs ────────────────────────────────────────────────────────────

export interface UserListItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
  createdAt: Date;
}

export interface PaginatedUsers {
  users: UserListItem[];
  total: number;
  page: number;
  totalPages: number;
}
