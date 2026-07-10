import { Router } from 'express';
import { authenticate, authorize } from '@middlewares/auth.middleware';
import { ROLES } from '@constants/roles';
import { validateObjectIdParam, validateBulkIds } from '@validators/common.validator';
import { validateCreateCategory, validateUpdateCategory } from '@validators/category.validator';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  bulkDeleteCategories,
} from '@controllers/category.controller';

const router = Router();

router.get('/', getCategories);
router.get('/:id', validateObjectIdParam(), getCategoryById);

router.post('/', authenticate, authorize(ROLES.ADMIN), validateCreateCategory, createCategory);
router.patch(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN),
  validateObjectIdParam(),
  validateUpdateCategory,
  updateCategory,
);
router.delete('/:id', authenticate, authorize(ROLES.ADMIN), validateObjectIdParam(), deleteCategory);
router.post('/bulk-delete', authenticate, authorize(ROLES.ADMIN), validateBulkIds, bulkDeleteCategories);

export default router;