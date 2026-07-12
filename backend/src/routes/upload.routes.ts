import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate, authorize } from '@middlewares/auth.middleware';
import { uploadSingleImage, uploadMultipleImages } from '@middlewares/upload.middleware';
import { ROLES } from '@constants/roles';
import { uploadImage, uploadImages, deleteUploadedImage } from '@controllers/upload.controller';

const router = Router();

router.use(authenticate);

// Uploads are expensive (disk/bandwidth) and an easy target for abuse by an
// authenticated-but-malicious account, so they get their own, tighter limiter
// on top of the general API one.
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many uploads. Please try again later.' },
});

// Single image - used for avatars and one-off uploads by any signed-in user.
router.post('/image', uploadLimiter, uploadSingleImage, uploadImage);

// Multiple images - product galleries, admin/vendor only.
router.post(
  '/images',
  uploadLimiter,
  authorize(ROLES.ADMIN, ROLES.VENDOR),
  uploadMultipleImages,
  uploadImages,
);

router.delete('/:filename', authorize(ROLES.ADMIN, ROLES.VENDOR), deleteUploadedImage);

export default router;