import { Router } from 'express';
import { authenticate } from '@middlewares/auth.middleware';
import { validateObjectIdParam } from '@validators/common.validator';
import { validateAddCartItem, validateUpdateCartItem, validateMergeCart } from '@validators/cart.validator';
import {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
  mergeCart,
} from '@controllers/cart.controller';

const router = Router();

router.use(authenticate);

router.get('/', getCart);
router.post('/items', validateAddCartItem, addCartItem);
router.patch('/items/:productId', validateObjectIdParam('productId'), validateUpdateCartItem, updateCartItem);
router.delete('/items/:productId', validateObjectIdParam('productId'), removeCartItem);
router.delete('/', clearCart);
router.post('/merge', validateMergeCart, mergeCart);

export default router;