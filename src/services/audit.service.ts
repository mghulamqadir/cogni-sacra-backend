import type { Types } from 'mongoose';
import { AuditLog } from '../models/AuditLog.js';

export async function audit(input: {
  institutionId?: Types.ObjectId;
  actorUserId: Types.ObjectId;
  action: string;
  resourceType: string;
  resourceId?: Types.ObjectId;
  metadata?: Record<string, unknown>;
  requestId?: string;
}): Promise<void> {
  await AuditLog.create(input);
}
