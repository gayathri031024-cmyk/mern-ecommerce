import { Router } from 'express';
import { authenticate, authorize } from '@middlewares/auth.middleware';
import { ROLES } from '@constants/roles';
import { validateObjectIdParam, validateBulkIds } from '@validators/common.validator';
import { cacheGet, bustCacheOnMutation } from '@middlewares/cache.middleware';
import {
  validateCreateProduct,
  validateUpdateProduct,
  validateBulkStockUpdate,
} from '@validators/product.validator';
import {
  getProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkDeleteProducts,
  bulkUpdateStock,
} from '@controllers/product.controller';

const router = Router();

// Product catalog changes infrequently relative to how often it's browsed,
// so short-TTL caching cuts DB load significantly under traffic. Any
// mutation below busts the whole prefix so shoppers never see stale data
// for more than a few seconds after an admin/vendor edit.
router.use(bustCacheOnMutation('/api/products'));

router.get('/', cacheGet(30), getProducts);
router.get('/slug/:slug', cacheGet(60), getProductBySlug);
router.get('/:id', validateObjectIdParam(), cacheGet(60), getProductById);

router.post(
  '/',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.VENDOR),
  validateCreateProduct,
  createProduct,
);
router.patch(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.VENDOR),
  validateObjectIdParam(),
  validateUpdateProduct,
  updateProduct,
);
router.delete(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.VENDOR),
  validateObjectIdParam(),
  deleteProduct,
);

router.post(
  '/bulk-delete',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.VENDOR),
  validateBulkIds,
  bulkDeleteProducts,
);
router.patch(
  '/bulk-stock',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.VENDOR),
  validateBulkStockUpdate,
  bulkUpdateStock,
);

export default router;
