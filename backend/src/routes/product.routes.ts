import { Router } from 'express';
import { authenticate, authorize } from '@middlewares/auth.middleware';
import { ROLES } from '@constants/roles';
import { validateObjectIdParam, validateBulkIds } from '@validators/common.validator';
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

router.get('/', getProducts);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id', validateObjectIdParam(), getProductById);

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
