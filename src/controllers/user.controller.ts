import type { Request, Response } from 'express';
import type { AuthRequest } from '../types/index.js';
import * as userService from '../services/user.service.js';
import { sendSuccess } from '../utils/response.js';
import type { UpdateProfileDto, ListUsersQuery } from '../dtos/index.js';

export async function getProfile(req: Request, res: Response): Promise<void> {
  const { _id } = (req as AuthRequest).user;
  const user = await userService.getUserById(_id.toString());
  sendSuccess(res, 'Profile fetched', user);
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  const { _id } = (req as AuthRequest).user;
  const dto = req.body as UpdateProfileDto;
  const user = await userService.updateProfile(_id.toString(), dto);
  sendSuccess(res, 'Profile updated', user);
}

// Admin only
export async function listUsers(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as ListUsersQuery;
  const result = await userService.listUsers(query);
  sendSuccess(res, 'Users fetched', result);
}

export async function getUserById(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const user = await userService.getUserById(id);
  sendSuccess(res, 'User fetched', user);
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  await userService.deleteUser(id);
  sendSuccess(res, 'User deleted');
}
