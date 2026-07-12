import Activity, { ActivityType } from '@models/Activity';
import { logger } from '@utils/logger';

interface LogActivityInput {
  user: string;
  type: ActivityType;
  description: string;
  entityType?: 'product' | 'order' | 'review' | 'category';
  entityId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Records an entry in a user's activity feed. Failures are logged, never
 * thrown - activity logging is a side-effect and must not break the caller's
 * primary action.
 */
export async function logActivity(input: LogActivityInput): Promise<void> {
  try {
    await Activity.create(input);
  } catch (error) {
    logger.error('Failed to log activity', error);
  }
}