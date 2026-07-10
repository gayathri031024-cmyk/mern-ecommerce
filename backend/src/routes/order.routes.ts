import { Router } from 'express';
import { authenticate, authorize } from '@middlewares/auth.middleware';
import { ROLES } from '@constants/roles';
import { validateObjectIdParam } from '@validators/common.validator';
import {
  validateCreateOrder,
  validateUpdateOrderStatus,
  validateBulkStatusUpdate,
} from '@validators/order.validator';
import {
  createOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  deleteOrder,
  bulkUpdateOrderStatus,
} from '@controllers/order.controller';

const router = Router();

router.use(authenticate);

router.get('/admin', authorize(ROLES.ADMIN), getAllOrders);
router.patch('/bulk-status', authorize(ROLES.ADMIN), validateBulkStatusUpdate, bulkUpdateOrderStatus);

router.get('/', getMyOrders);
router.post('/', validateCreateOrder, createOrder);
router.get('/:id', validateObjectIdParam(), getOrderById);
router.patch(
  '/:id/status',
  authorize(ROLES.ADMIN),
  validateObjectIdParam(),
  validateUpdateOrderStatus,
  updateOrderStatus,
);
router.patch('/:id/cancel', validateObjectIdParam(), cancelOrder);
router.delete('/:id', authorize(ROLES.ADMIN), validateObjectIdParam(), deleteOrder);

export default router;