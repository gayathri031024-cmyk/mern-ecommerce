import { Router } from 'express';
import { authenticate, authorize } from '@middlewares/auth.middleware';
import { ROLES } from '@constants/roles';
import { validateObjectIdParam, validateBulkIds } from '@validators/common.validator';
import { validateCreateReview, validateUpdateReview } from '@validators/review.validator';
import {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  bulkDeleteReviews,
} from '@controllers/review.controller';

const router = Router();

router.get('/product/:productId', validateObjectIdParam('productId'), getProductReviews);

router.post('/', authenticate, validateCreateReview, createReview);
router.patch('/:id', authenticate, validateObjectIdParam(), validateUpdateReview, updateReview);
router.delete('/:id', authenticate, validateObjectIdParam(), deleteReview);

router.post('/bulk-delete', authenticate, authorize(ROLES.ADMIN), validateBulkIds, bulkDeleteReviews);

export default router;