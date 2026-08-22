import { Schema, model, type Types } from 'mongoose';
export interface IAuditLog {
  institutionId?: Types.ObjectId;
  actorUserId: Types.ObjectId;
  action: string;
  resourceType: string;
  resourceId?: Types.ObjectId;
  metadata?: Record<string, unknown>;
  requestId?: string;
}
const schema = new Schema<IAuditLog>(
  {
    institutionId: { type: Schema.Types.ObjectId, ref: 'Institution' },
    actorUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    resourceType: { type: String, required: true },
    resourceId: Schema.Types.ObjectId,
    metadata: Schema.Types.Mixed,
    requestId: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
schema.index({ institutionId: 1, createdAt: -1 });
export const AuditLog = model<IAuditLog>('AuditLog', schema);
