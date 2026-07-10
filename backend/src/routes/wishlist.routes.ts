import { Router } from 'express';
import { authenticate } from '@middlewares/auth.middleware';
import { validateProductIdParam, validateBulkProductIds } from '@validators/wishlist.validator';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  bulkAddToWishlist,
} from '@controllers/wishlist.controller';

const router = Router();

router.use(authenticate);

router.get('/', getWishlist);
router.post('/bulk-add', validateBulkProductIds, bulkAddToWishlist);
router.post('/:productId', validateProductIdParam, addToWishlist);
router.delete('/:productId', validateProductIdParam, removeFromWishlist);
router.delete('/', clearWishlist);

export default router;