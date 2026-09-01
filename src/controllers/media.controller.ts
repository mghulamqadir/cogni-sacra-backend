import type { Request, Response } from 'express';
import { AppError } from '../utils/AppError.js';
import * as mediaService from '../services/media.service.js';
import { sendCreated, sendSuccess } from '../utils/response.js';
import type { AuthRequest } from '../types/index.js';

export async function uploadImage(req: Request, res: Response): Promise<void> {
  if (req.file === undefined) {
    throw new AppError('No file provided', 400);
  }

  const result = await mediaService.uploadImage(req.file);
  sendCreated(res, 'Image uploaded', result);
}

export async function uploadVideo(req: Request, res: Response): Promise<void> {
  if (req.file === undefined) {
    throw new AppError('No file provided', 400);
  }

  const result = await mediaService.uploadVideo(req.file);
  sendCreated(res, 'Video uploaded', result);
}

export async function createVideoUploadSignature(req: Request, res: Response): Promise<void> {
  const actor = (req as AuthRequest).user;
  sendSuccess(
    res,
    'Video upload signature created',
    mediaService.createVideoUploadSignature(actor)
  );
}

export async function completeVideoUpload(req: Request, res: Response): Promise<void> {
  const actor = (req as AuthRequest).user;
  const result = await mediaService.completeVideoUpload(actor, req.body?.publicId);
  sendSuccess(res, 'Video upload completed', result);
}
