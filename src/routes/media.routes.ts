import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import { uploadImage, uploadVideo } from '../middlewares/upload.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as mediaController from '../controllers/media.controller.js';

const router = Router();

router.use(authenticate);

router.post('/image', uploadImage.single('image'), asyncHandler(mediaController.uploadImage));
router.post('/video', uploadVideo.single('video'), asyncHandler(mediaController.uploadVideo));

export default router;
