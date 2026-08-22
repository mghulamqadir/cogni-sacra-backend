import { createHash, randomBytes } from 'node:crypto';
import { Institution } from '../models/Institution.js';
import { Invitation } from '../models/Invitation.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { UserRole, UserStatus, type AuthenticatedUser } from '../types/index.js';
import { audit } from './audit.service.js';
import { sendInvitationEmail } from './email.service.js';
import { env } from '../config/env.js';

const slugify = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export async function createInstitution(
  actor: AuthenticatedUser,
  input: { name: string; slug: string; logoUrl?: string },
  requestId: string
) {
  const institution = await Institution.create({
    ...input,
    slug: slugify(input.slug),
    createdBy: actor._id,
  });
  await audit({
    actorUserId: actor._id,
    action: 'institution.created',
    resourceType: 'Institution',
    resourceId: institution._id,
    requestId,
  });
  return institution;
}

export async function approveInstitution(actor: AuthenticatedUser, id: string, requestId: string) {
  const institution = await Institution.findById(id).exec();
  if (institution === null) throw new AppError('Institution not found', 404, 'NOT_FOUND');
  if (institution.status !== 'approved') {
    institution.status = 'approved';
    institution.approvedAt = new Date();
    await institution.save();
  }
  await audit({
    actorUserId: actor._id,
    action: 'institution.approved',
    resourceType: 'Institution',
    resourceId: institution._id,
    requestId,
  });
  return institution;
}

export async function getInstitution(actor: AuthenticatedUser, id: string) {
  if (actor.role !== UserRole.PlatformAdmin && actor.institutionId?.toString() !== id)
    throw new AppError('Forbidden', 403, 'FORBIDDEN');
  const institution = await Institution.findById(id).lean().exec();
  if (institution === null) throw new AppError('Institution not found', 404, 'NOT_FOUND');
  return institution;
}

export async function inviteMember(
  actor: AuthenticatedUser,
  institutionId: string,
  input: { email: string; role: UserRole },
  requestId: string
) {
  const institution = await Institution.findById(institutionId).lean().exec();
  if (institution === null) throw new AppError('Institution not found', 404, 'NOT_FOUND');
  if (institution.status !== 'approved')
    throw new AppError('Institution is not approved', 409, 'INSTITUTION_NOT_APPROVED');
  if (actor.role === UserRole.PlatformAdmin) {
    if (input.role !== UserRole.InstitutionAdmin)
      throw new AppError(
        'Platform admin may only invite the first institution admin',
        403,
        'FORBIDDEN'
      );
    const count = await User.countDocuments({
      institutionId,
      role: UserRole.InstitutionAdmin,
      status: UserStatus.Active,
    });
    if (count > 0)
      throw new AppError(
        'Institution already has an active administrator',
        409,
        'INSTITUTION_ADMIN_EXISTS'
      );
    if (
      await Invitation.exists({ institutionId, role: UserRole.InstitutionAdmin, status: 'pending' })
    )
      throw new AppError(
        'A first-admin invitation is already pending',
        409,
        'INSTITUTION_ADMIN_INVITATION_EXISTS'
      );
  } else if (actor.role === UserRole.InstitutionAdmin) {
    if (
      actor.institutionId?.toString() !== institutionId ||
      ![UserRole.Instructor, UserRole.Learner].includes(input.role)
    )
      throw new AppError('Forbidden', 403, 'FORBIDDEN');
  } else throw new AppError('Forbidden', 403, 'FORBIDDEN');
  const email = input.email.trim().toLowerCase();
  if (await User.exists({ email }))
    throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');
  await Invitation.updateMany({ institutionId, email, status: 'pending' }, { status: 'revoked' });
  const token = randomBytes(32).toString('base64url');
  const invitation = new Invitation({
    institutionId,
    email,
    role: input.role as 'institution_admin' | 'instructor' | 'learner',
    invitedByRole: actor.role as 'platform_admin' | 'institution_admin',
    tokenHash: createHash('sha256').update(token).digest('hex'),
    invitedBy: actor._id,
    expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
  });
  await invitation.save();
  await sendInvitationEmail(
    email,
    `${env.CLIENT_URL}/accept-invitation?token=${encodeURIComponent(token)}`
  );
  await audit({
    institutionId: invitation.institutionId,
    actorUserId: actor._id,
    action: 'member.invited',
    resourceType: 'Invitation',
    resourceId: invitation._id,
    metadata: { email, role: input.role },
    requestId,
  });
  return { id: invitation._id, email, role: input.role, expiresAt: invitation.expiresAt };
}

export async function listMembers(
  actor: AuthenticatedUser,
  institutionId: string,
  query: { page: number; limit: number; role?: string; status?: string; search?: string }
) {
  if (actor.role !== UserRole.PlatformAdmin && actor.institutionId?.toString() !== institutionId)
    throw new AppError('Forbidden', 403, 'FORBIDDEN');
  const filter: Record<string, unknown> = { institutionId };
  if (query.role) filter.role = query.role;
  if (query.status) filter.status = query.status;
  if (query.search)
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { email: { $regex: query.search, $options: 'i' } },
    ];
  const [members, total] = await Promise.all([
    User.find(filter)
      .select('-password -googleId')
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean(),
    User.countDocuments(filter),
  ]);
  return { members, total, page: query.page, totalPages: Math.ceil(total / query.limit) };
}
