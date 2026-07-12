import { Schema, model, Document, Model, Types } from 'mongoose';

export type NotificationType =
  | 'order_placed'
  | 'order_status'
  | 'wishlist'
  | 'review'
  | 'system'
  | 'promotion';

export interface INotification extends Document {
  user: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

interface NotificationModel extends Model<INotification> {
  unreadCount(userId: string): Promise<number>;
}

const notificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['order_placed', 'order_status', 'wishlist', 'review', 'system', 'promotion'],
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    link: { type: String },
    isRead: { type: Boolean, default: false, index: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

// Common access pattern: "my notifications, newest first" and unread badge counts.
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1 });

notificationSchema.statics.unreadCount = function (userId: string) {
  return this.countDocuments({ user: userId, isRead: false });
};

notificationSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default model<INotification, NotificationModel>('Notification', notificationSchema);
