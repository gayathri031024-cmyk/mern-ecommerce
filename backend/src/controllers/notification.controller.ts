import { Request, Response } from 'express';
import Notification from '@models/Notification';
import { asyncHandler } from '@utils/asyncHandler';
import { AppError } from '@utils/AppError';
import { getPagination, buildMeta } from '@utils/queryHelpers';

export const getMyNotifications = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const { unreadOnly } = req.query;

  const filter: Record<string, unknown> = { user: req.user!.id };
  if (unreadOnly === 'true') filter.isRead = false;

  const [items, totalItems, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: req.user!.id, isRead: false }),
  ]);

  res.status(200).json({
    success: true,
    message: 'Notifications retrieved successfully',
    data: { items, meta: buildMeta(page, limit, totalItems), unreadCount },
  });
});

export const markNotificationAsRead = asyncHandler(async (req: Request, res: Response) => {
  const notification = await Notification.findOne({ _id: req.params.id, user: req.user!.id });
  if (!notification) throw AppError.notFound('Notification not found');

  notification.isRead = true;
  await notification.save();

  res.status(200).json({ success: true, message: 'Notification marked as read', data: notification });
});

export const markAllNotificationsAsRead = asyncHandler(async (req: Request, res: Response) => {
  const result = await Notification.updateMany(
    { user: req.user!.id, isRead: false },
    { isRead: true },
  );

  res.status(200).json({
    success: true,
    message: `${result.modifiedCount} notification(s) marked as read`,
    data: { updatedCount: result.modifiedCount },
  });
});

export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
  const notification = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user!.id });
  if (!notification) throw AppError.notFound('Notification not found');

  res.status(200).json({ success: true, message: 'Notification deleted successfully' });
});
