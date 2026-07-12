import { Router } from 'express';
import { authenticate } from '@middlewares/auth.middleware';
import { validateObjectIdParam } from '@validators/common.validator';
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '@controllers/notification.controller';

const router = Router();

router.use(authenticate);

router.get('/', getMyNotifications);
router.patch('/read-all', markAllNotificationsAsRead);
router.patch('/:id/read', validateObjectIdParam(), markNotificationAsRead);
router.delete('/:id', validateObjectIdParam(), deleteNotification);

export default router;