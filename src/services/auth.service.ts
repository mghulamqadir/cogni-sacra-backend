import { User } from '../models/User.js';
import type { IUserDocument } from '../models/User.js';
import { OAuth2Client } from 'google-auth-library';
import { AppError } from '../utils/AppError.js';
import type {
  RegisterDto,
  LoginDto,
  GoogleLoginDto,
  ChangePasswordDto,
  UserDto,
  AuthResult,
  RegisterResult,
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
import { createHash } from 'node:crypto';
import mongoose from 'mongoose';
import { Invitation } from '../models/Invitation.js';
import { UserRole, UserStatus } from '../types/index.js';
import type { AcceptInvitationDto } from '../dtos/index.js';

const googleClient = new OAuth2Client();

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

export async function registerUser(dto: RegisterDto): Promise<RegisterResult> {
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
    role: UserRole.IndependentLearner,
    status: UserStatus.Active,
  });

  const verificationToken = generateEmailVerificationToken(user._id.toString(), user.email);
  const verifyUrl = buildClientTokenUrl(env.CLIENT_URL, 'verify-email', verificationToken);

  await sendEmailVerification(user.email, verifyUrl);

  return { user: toUserDto(user) };
}

export async function loginUser(dto: LoginDto): Promise<AuthResult> {
  const { email, password } = dto;
  const user = await User.findOne({ email }).select('+password').exec();

  if (
    user === null ||
    user.password === undefined ||
    !(await comparePassword(password, user.password))
  ) {
    throw new AppError('Invalid email or password', 401);
  }
  if (user.status !== UserStatus.Active)
    throw new AppError('Account is not active', 403, 'ACCOUNT_UNAVAILABLE');

  const token = signToken(user._id.toString(), user.email, user.role);

  return { token, user: toUserDto(user) };
}

export async function loginWithGoogle(dto: GoogleLoginDto): Promise<AuthResult> {
  let ticket;
  try {
    ticket = await googleClient.verifyIdToken({
      idToken: dto.credential,
      audience: env.GOOGLE_CLIENT_ID,
    });
  } catch {
    throw new AppError('Invalid or expired Google credential', 401);
  }

  const payload = ticket.getPayload();
  const googleId = payload?.sub;
  const email = payload?.email?.trim().toLowerCase();

  if (
    googleId === undefined ||
    email === undefined ||
    email.length === 0 ||
    payload?.email_verified !== true
  ) {
    throw new AppError('Google account does not have a verified email address', 401);
  }

  let user = await User.findOne({ googleId }).exec();

  if (user === null) {
    user = await User.findOne({ email }).select('+googleId +password').exec();

    if (user !== null) {
      if (user.googleId !== undefined && user.googleId !== googleId) {
        throw new AppError('Email is already linked to another Google account', 409);
      }

      if (
        user.password === undefined ||
        dto.password === undefined ||
        !(await comparePassword(dto.password, user.password))
      ) {
        throw new AppError(
          'An account with this email already exists. Provide its password to link Google.',
          409
        );
      }

      user.googleId = googleId;
      user.isEmailVerified = true;
      await user.save();
    } else {
      const fallbackName = email.split('@')[0] ?? 'Google User';
      user = await User.create({
        name: payload.name?.trim() || fallbackName,
        email,
        googleId,
        isEmailVerified: true,
        role: UserRole.IndependentLearner,
        status: UserStatus.Active,
      });
    }
  }

  if (user.status !== UserStatus.Active)
    throw new AppError('Account is not active', 403, 'ACCOUNT_UNAVAILABLE');

  const token = signToken(user._id.toString(), user.email, user.role);
  return { token, user: toUserDto(user) };
}

export async function acceptInvitation(dto: AcceptInvitationDto): Promise<AuthResult> {
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const tokenHash = createHash('sha256').update(dto.token).digest('hex');
      const invitation = await Invitation.findOne({ tokenHash, status: 'pending' })
        .session(session)
        .exec();
      if (invitation === null)
        throw new AppError('Invitation is invalid or already used', 400, 'INVITATION_INVALID');
      if (invitation.expiresAt <= new Date()) {
        invitation.status = 'expired';
        await invitation.save({ session });
        throw new AppError('Invitation has expired', 400, 'INVITATION_EXPIRED');
      }
      if (await User.exists({ email: invitation.email }).session(session))
        throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');
      const user = new User({
        name: dto.name,
        email: invitation.email,
        password: await hashPassword(dto.password),
        role: invitation.role as UserRole,
        institutionId: invitation.institutionId,
        status: UserStatus.Active,
        isEmailVerified: true,
      });
      await user.save({ session });
      invitation.status = 'accepted';
      invitation.acceptedAt = new Date();
      await invitation.save({ session });
      return {
        token: signToken(user._id.toString(), user.email, user.role),
        user: toUserDto(user),
      };
    });
  } finally {
    await session.endSession();
  }
}

export async function getMe(userId: string): Promise<UserDto> {
  const user = await getLeanUserByIdOrThrow(userId);
  return toUserDto(user);
}

export async function changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
  const { currentPassword, newPassword } = dto;
  const user = await getUserWithPasswordByIdOrThrow(userId);

  if (user.password === undefined) {
    throw new AppError('Set a password using the forgot password flow first', 400);
  }

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
