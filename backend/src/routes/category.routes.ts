import { Router } from 'express';
import { authenticate, authorize } from '@middlewares/auth.middleware';
import { ROLES } from '@constants/roles';
import { validateObjectIdParam, validateBulkIds } from '@validators/common.validator';
import { validateCreateCategory, validateUpdateCategory } from '@validators/category.validator';
import { cacheGet, bustCacheOnMutation } from '@middlewares/cache.middleware';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  bulkDeleteCategories,
} from '@controllers/category.controller';

const router = Router();

// Categories change even less often than products, so cache them a bit longer.
router.use(bustCacheOnMutation('/api/categories'));

router.get('/', cacheGet(120), getCategories);
router.get('/:id', validateObjectIdParam(), cacheGet(120), getCategoryById);

router.post('/', authenticate, authorize(ROLES.ADMIN), validateCreateCategory, createCategory);
router.patch(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN),
  validateObjectIdParam(),
  validateUpdateCategory,
  updateCategory,
);
router.delete(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN),
  validateObjectIdParam(),
  deleteCategory,
);
router.post(
  '/bulk-delete',
  authenticate,
  authorize(ROLES.ADMIN),
  validateBulkIds,
  bulkDeleteCategories,
);

export default router;