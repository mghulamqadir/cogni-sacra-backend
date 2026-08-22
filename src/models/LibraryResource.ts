import { Schema, model, type Types } from 'mongoose';
export interface ILibraryResource {
  institutionId?: Types.ObjectId;
  visibility: 'platform' | 'institution';
  title: string;
  description?: string;
  authors?: string[];
  subjects?: string[];
  resourceType: 'article' | 'book' | 'video' | 'link' | 'file';
  url?: string;
  fileUrl?: string;
  aiSummary?: string;
  createdBy: Types.ObjectId;
}
const schema = new Schema<ILibraryResource>(
  {
    institutionId: { type: Schema.Types.ObjectId, ref: 'Institution' },
    visibility: { type: String, enum: ['platform', 'institution'], required: true },
    title: { type: String, required: true },
    description: String,
    authors: [String],
    subjects: [String],
    resourceType: {
      type: String,
      enum: ['article', 'book', 'video', 'link', 'file'],
      required: true,
    },
    url: String,
    fileUrl: String,
    aiSummary: String,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);
schema.index({ title: 'text', description: 'text', authors: 'text', subjects: 'text' });
schema.index({ institutionId: 1, visibility: 1 });
export const LibraryResource = model<ILibraryResource>('LibraryResource', schema);
