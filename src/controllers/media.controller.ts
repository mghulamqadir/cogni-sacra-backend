import type { Request, Response } from 'express';
import { AppError } from '../utils/AppError.js';
import * as mediaService from '../services/media.service.js';
import { sendCreated } from '../utils/response.js';

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
