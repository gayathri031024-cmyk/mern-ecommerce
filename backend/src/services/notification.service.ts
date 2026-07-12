import Notification, { NotificationType } from '@models/Notification';
import { logger } from '@utils/logger';

interface CreateNotificationInput {
  user: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Creates a notification for a user. Failures are logged, never thrown -
 * a notification is a side-effect of some other action (placing an order,
 * etc.) and should never cause that primary action to fail.
 */
export async function createNotification(input: CreateNotificationInput): Promise<void> {
  try {
    await Notification.create(input);
  } catch (error) {
    logger.error('Failed to create notification', error);
  }
}
