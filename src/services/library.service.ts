import { LibraryResource, type ILibraryResource } from '../models/LibraryResource.js';
import type { QueryFilter } from 'mongoose';
import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';
import { UserRole, type AuthenticatedUser } from '../types/index.js';
const enabled = () => {
  if (!env.FEATURE_VIRTUAL_LIBRARY)
    throw new AppError('Virtual library is disabled', 404, 'FEATURE_DISABLED');
};
export async function list(
  actor: AuthenticatedUser,
  q: { page: number; limit: number; search?: string }
) {
  enabled();
  const visible =
    actor.institutionId == null
      ? [{ visibility: 'platform' }]
      : [
          { visibility: 'platform' },
          { visibility: 'institution', institutionId: actor.institutionId },
        ];
  const filter: Record<string, unknown> = { $or: visible };
  if (q.search) filter.$text = { $search: q.search };
  const [resources, total] = await Promise.all([
    LibraryResource.find(filter)
      .skip((q.page - 1) * q.limit)
      .limit(q.limit)
      .lean(),
    LibraryResource.countDocuments(filter),
  ]);
  return { resources, total, page: q.page, totalPages: Math.ceil(total / q.limit) };
}
export async function create(actor: AuthenticatedUser, input: Record<string, unknown>) {
  enabled();
  if (actor.role === UserRole.PlatformAdmin)
    return LibraryResource.create({
      ...input,
      visibility: 'platform',
      institutionId: undefined,
      createdBy: actor._id,
    });
  if (actor.role === UserRole.InstitutionAdmin)
    return LibraryResource.create({
      ...input,
      visibility: 'institution',
      institutionId: actor.institutionId,
      createdBy: actor._id,
    });
  throw new AppError('Forbidden', 403, 'FORBIDDEN');
}
export async function update(actor: AuthenticatedUser, id: string, input: Record<string, unknown>) {
  enabled();
  const filter: QueryFilter<ILibraryResource> =
    actor.role === UserRole.PlatformAdmin
      ? { _id: id, visibility: 'platform' }
      : { _id: id, visibility: 'institution', institutionId: actor.institutionId };
  const resource = await LibraryResource.findOneAndUpdate(filter, input, {
    new: true,
    runValidators: true,
  });
  if (resource === null) throw new AppError('Resource not found', 404, 'NOT_FOUND');
  return resource;
}
export async function remove(actor: AuthenticatedUser, id: string) {
  enabled();
  const filter: QueryFilter<ILibraryResource> =
    actor.role === UserRole.PlatformAdmin
      ? { _id: id, visibility: 'platform' }
      : { _id: id, visibility: 'institution', institutionId: actor.institutionId };
  if ((await LibraryResource.deleteOne(filter)).deletedCount === 0)
    throw new AppError('Resource not found', 404, 'NOT_FOUND');
}
