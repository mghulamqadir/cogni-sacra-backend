import type { Request, Response } from 'express';
import type { AuthRequest } from '../types/index.js';
import * as authService from '../services/auth.service.js';
import { sendSuccess, sendCreated } from '../utils/response.js';
import type {
  RegisterDto,
  LoginDto,
  GoogleLoginDto,
  ChangePasswordDto,
  AcceptInvitationDto,
} from '../dtos/index.js';
import { AppError } from '../utils/AppError.js';

export async function register(req: Request, res: Response): Promise<void> {
  const dto = req.body as RegisterDto;
  const result = await authService.registerUser(dto);
  sendCreated(
    res,
    'Registration successful. Please check your email to verify your account.',
    result
  );
}

export async function acceptInvitation(req: Request, res: Response): Promise<void> {
  const result = await authService.acceptInvitation(req.body as AcceptInvitationDto);
  sendCreated(res, 'Invitation accepted', result);
}

export async function login(req: Request, res: Response): Promise<void> {
  const dto = req.body as LoginDto;
  const result = await authService.loginUser(dto);
  sendSuccess(res, 'Login successful', result);
}

export async function googleLogin(req: Request, res: Response): Promise<void> {
  const dto = req.body as GoogleLoginDto;
  const result = await authService.loginWithGoogle(dto);
  sendSuccess(res, 'Google login successful', result);
}

export async function verifyEmail(req: Request, res: Response): Promise<void> {
  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    throw new AppError('Verification token is required', 400);
  }

  const user = await authService.verifyEmail(token);
  sendSuccess(res, 'Email verified successfully', { user });
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body;
  await authService.forgotPassword(email);
  sendSuccess(res, 'A Reset Password link has been sent successfully to your email');
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { token, password } = req.body;
  const user = await authService.resetPassword(token, password);
  sendSuccess(res, 'Password reset successfully', { user });
}

export async function getMe(req: Request, res: Response): Promise<void> {
  const { _id } = (req as AuthRequest).user;
  const user = await authService.getMe(_id.toString());
  sendSuccess(res, 'User fetched', user);
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  const { _id } = (req as AuthRequest).user;
  const dto = req.body as ChangePasswordDto;
  await authService.changePassword(_id.toString(), dto);
  sendSuccess(res, 'Password changed successfully');
}
