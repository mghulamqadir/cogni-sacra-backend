import type { Request } from 'express';
import multer from 'multer';
import type { FileFilterCallback } from 'multer';
import { AppError } from '../utils/AppError.js';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const MAX_IMAGE_SIZE_MB = 5;
const MAX_VIDEO_SIZE_MB = 100;

const storage = multer.memoryStorage();

function imageFileFilter(
  _req: Request,
  file: NonNullable<Request['file']>,
  cb: FileFilterCallback
): void {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only JPEG, PNG, and WebP images are allowed', 400));
  }
}

export const uploadImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: MAX_IMAGE_SIZE_MB * 1024 * 1024 },
});

function videoFileFilter(
  _req: Request,
  file: NonNullable<Request['file']>,
  cb: FileFilterCallback
): void {
  if (ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only MP4, WebM, and MOV videos are allowed', 400));
  }
}

export const uploadVideo = multer({
  storage,
  fileFilter: videoFileFilter,
  limits: { fileSize: MAX_VIDEO_SIZE_MB * 1024 * 1024 },
});
