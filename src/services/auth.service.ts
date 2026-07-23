import { User } from '../models/User.js';
import type { IUserDocument } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import type {
  RegisterDto,
  LoginDto,
  ChangePasswordDto,
  UserDto,
  AuthResult,
} from '../dtos/index.js';
import signToken, {
  generateEmailVerificationToken,
  verifyEmailToken,
  generatePasswordResetToken,
  verifyPasswordResetToken,
} from '../utils/jwt.js';
import {
  assertPasswordsMatch,
  buildClientTokenUrl,
  comparePassword,
  hashPassword,
  toUserDto,
} from '../utils/user.helpers.js';
import { sendEmailVerification, sendPasswordResetEmail } from './email.service.js';
import { env } from '../config/env.js';

async function getUserByIdOrThrow(userId: string): Promise<IUserDocument> {
  const user = await User.findById(userId).exec();

  if (user === null) {
    throw new AppError('User not found', 404);
  }

  return user;
}

async function getLeanUserByIdOrThrow(userId: string) {
  const user = await User.findById(userId).lean().exec();

  if (user === null) {
    throw new AppError('User not found', 404);
  }

  return user;
}

async function getUserWithPasswordByIdOrThrow(userId: string) {
  const user = await User.findById(userId).select('+password').exec();

  if (user === null) {
    throw new AppError('User not found', 404);
  }

  return user;
}

async function runTokenAction<T>(
  token: string,
  verifyToken: (value: string) => { userId: string },
  onSuccess: (user: Awaited<ReturnType<typeof getUserByIdOrThrow>>) => Promise<T>,
  invalidMessage: string
): Promise<T> {
  try {
    const payload = verifyToken(token);
    const user = await getUserByIdOrThrow(payload.userId);
    return await onSuccess(user);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(invalidMessage, 401);
  }
}

export async function registerUser(dto: RegisterDto): Promise<AuthResult> {
  const { name, email, password, confirmPassword } = dto;
  const existing = await User.findOne({ email }).lean().exec();

  if (existing !== null) {
    throw new AppError('Email already registered', 409);
  }

  assertPasswordsMatch(password, confirmPassword);

  const hashedPassword = await hashPassword(password);
  const user = await User.create({
    name: name,
    email: email,
    password: hashedPassword,
    isEmailVerified: false,
  });

  const verificationToken = generateEmailVerificationToken(user._id.toString(), user.email);
  const verifyUrl = buildClientTokenUrl(env.CLIENT_URL, 'verify-email', verificationToken);

  await sendEmailVerification(user.email, verifyUrl);

  const token = signToken(user._id.toString(), user.email, user.role);

  return { token, user: toUserDto(user) };
}

export async function loginUser(dto: LoginDto): Promise<AuthResult> {
  const { email, password } = dto;
  const user = await User.findOne({ email }).select('+password').exec();

  if (user === null || !(await comparePassword(password, user.password))) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = signToken(user._id.toString(), user.email, user.role);

  return { token, user: toUserDto(user) };
}

export async function getMe(userId: string): Promise<UserDto> {
  const user = await getLeanUserByIdOrThrow(userId);
  return toUserDto(user);
}

export async function changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
  const { currentPassword, newPassword } = dto;
  const user = await getUserWithPasswordByIdOrThrow(userId);

  const isMatch = await comparePassword(currentPassword, user.password);

  if (!isMatch) {
    throw new AppError('Current password is incorrect', 400);
  }

  const hashedPassword = await hashPassword(newPassword);
  user.password = hashedPassword;
  await user.save();
}

// ─── Email Verification ───────────────────────────────────────────────────────

export async function verifyEmail(token: string): Promise<UserDto> {
  return runTokenAction(
    token,
    verifyEmailToken,
    async (user) => {
      if (user.isEmailVerified) {
        throw new AppError('Email already verified', 400);
      }

      user.isEmailVerified = true;
      await user.save();

      return toUserDto(user);
    },
    'Invalid or expired verification token'
  );
}

// ─── Password Reset ────────────────────────────────────────────────────────────

export async function forgotPassword(email: string): Promise<void> {
  const user = await User.findOne({ email }).exec();

  if (user === null) {
    throw new AppError('You are not registered with this Email', 400);
  }

  const resetToken = generatePasswordResetToken(user._id.toString(), user.email);
  const resetUrl = buildClientTokenUrl(env.CLIENT_URL, 'reset-password', resetToken);

  await sendPasswordResetEmail(user.email, resetUrl);
}

export async function resetPassword(token: string, newPassword: string): Promise<UserDto> {
  return runTokenAction(
    token,
    verifyPasswordResetToken,
    async (user) => {
      const hashedPassword = await hashPassword(newPassword);
      user.password = hashedPassword;
      await user.save();

      return toUserDto(user);
    },
    'Invalid or expired password reset token'
  );
}
