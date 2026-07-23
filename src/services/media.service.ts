import type { UploadApiOptions, UploadApiResponse } from 'cloudinary';
import type { Request } from 'express';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { cloudinary } from '../config/cloudinary.js';

// ─── Return shapes ────────────────────────────────────────────────────────────

export interface UploadResult {
  url: string;
  key: string;
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

export async function deleteMedia(
  key: string,
  resourceType: 'image' | 'video' = 'image'
): Promise<void> {
  await cloudinary.uploader.destroy(key, {
    resource_type: resourceType,
    invalidate: true,
  });
}
