import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { UserRole } from '../types/index.js';
import { uploadDocument, uploadImage, uploadVideo } from '../middlewares/upload.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as mediaController from '../controllers/media.controller.js';

const router = Router();

router.use(authenticate);
const uploaders = authorize(
  UserRole.PlatformAdmin,
  UserRole.InstitutionAdmin,
  UserRole.Instructor,
  UserRole.IndependentInstructor
);

router.post(
  '/video/upload-signature',
  uploaders,
  asyncHandler(mediaController.createVideoUploadSignature)
);
router.post('/video/complete', uploaders, asyncHandler(mediaController.completeVideoUpload));
router.post('/image', uploadImage.single('image'), asyncHandler(mediaController.uploadImage));
router.post('/video', uploadVideo.single('video'), asyncHandler(mediaController.uploadVideo));
router.post('/document', uploaders, uploadDocument.single('document'), asyncHandler(mediaController.uploadDocument));

export default router;
