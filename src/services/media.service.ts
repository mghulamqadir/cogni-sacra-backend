import type { UploadApiOptions, UploadApiResponse } from 'cloudinary';
import type { Request } from 'express';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { cloudinary } from '../config/cloudinary.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import type { AuthenticatedUser } from '../types/index.js';

// ─── Return shapes ────────────────────────────────────────────────────────────

export interface UploadResult {
  url: string;
  key: string;
}

export interface VideoUploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  publicId: string;
  uploadUrl: string;
  resourceType: 'video';
  maxFileSizeBytes: number;
  chunkSizeBytes: number;
}

// ─── Service functions ────────────────────────────────────────────────────────

function uploadBuffer(buffer: Buffer, options: UploadApiOptions): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error !== undefined) {
        reject(error);
        return;
      }

      if (result === undefined) {
        reject(new Error('Cloudinary upload completed without a result'));
        return;
      }

      resolve(result);
    });

    stream.end(buffer);
  });
}

export async function uploadImage(
  file: NonNullable<Request['file']>,
  folder = 'cogni-sacra/images'
): Promise<UploadResult> {
  // Normalise to WebP and cap dimensions at 1200px wide
  const processed = await sharp(file.buffer)
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();

  const result = await uploadBuffer(processed, {
    resource_type: 'image',
    folder,
    public_id: uuidv4(),
    format: 'webp',
  });

  return { url: result.secure_url, key: result.public_id };
}

export async function uploadVideo(
  file: NonNullable<Request['file']>,
  folder = 'cogni-sacra/videos'
): Promise<UploadResult> {
  const result = await uploadBuffer(file.buffer, {
    resource_type: 'video',
    folder,
    public_id: uuidv4(),
  });

  return { url: result.secure_url, key: result.public_id };
}

export async function uploadDocument(
  actor: AuthenticatedUser,
  file: NonNullable<Request['file']>
): Promise<UploadResult> {
  const result = await uploadBuffer(file.buffer, {
    resource_type: 'raw',
    folder: `cogni-sacra/documents/${actor._id.toString()}`,
    public_id: uuidv4(),
    use_filename: false,
  });
  return { url: result.secure_url, key: result.public_id };
}

/**
 * Creates signed parameters for the client to upload directly to Cloudinary.
 * The API never buffers the video or handles its bytes.
 */
export function createVideoUploadSignature(actor: AuthenticatedUser): VideoUploadSignature {
  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = `cogni-sacra/videos/${actor._id.toString()}/${uuidv4()}`;
  const params = { public_id: publicId, timestamp };
  const signature = cloudinary.utils.api_sign_request(params, env.CLOUDINARY_API_SECRET);

  return {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    timestamp,
    signature,
    publicId,
    uploadUrl: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/video/upload`,
    resourceType: 'video',
    maxFileSizeBytes: env.VIDEO_UPLOAD_MAX_BYTES,
    chunkSizeBytes: env.VIDEO_UPLOAD_CHUNK_SIZE_BYTES,
  };
}

/** Verify the client result and return Cloudinary's canonical asset URL. */
export async function completeVideoUpload(
  actor: AuthenticatedUser,
  publicId: unknown
): Promise<UploadResult> {
  if (typeof publicId !== 'string' || !publicId.startsWith(`cogni-sacra/videos/${actor._id}/`))
    throw new AppError('Invalid video upload identifier', 400, 'INVALID_UPLOAD');

  try {
    const resource = await cloudinary.api.resource(publicId, { resource_type: 'video' });
    if (resource.resource_type !== 'video' || !resource.secure_url)
      throw new AppError('Uploaded asset is not a video', 422, 'INVALID_UPLOAD');
    return { url: resource.secure_url, key: resource.public_id };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Video upload is not available yet', 409, 'UPLOAD_NOT_READY');
  }
}

export async function deleteMedia(
  key: string,
  resourceType: 'image' | 'video' = 'image'
): Promise<void> {
  await cloudinary.uploader.destroy(key, {
    resource_type: resourceType,
    invalidate: true,
  });
}
