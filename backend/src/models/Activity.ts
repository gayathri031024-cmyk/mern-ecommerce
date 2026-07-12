import { Schema, model, Document, Model, Types } from 'mongoose';

export type ActivityType =
  | 'viewed_product'
  | 'added_to_cart'
  | 'placed_order'
  | 'order_status_changed'
  | 'wrote_review'
  | 'added_to_wishlist'
  | 'removed_from_wishlist'
  | 'bookmarked_product'
  | 'logged_in'
  | 'updated_profile';

export interface IActivity extends Document {
  user: Types.ObjectId;
  type: ActivityType;
  description: string;
  entityType?: 'product' | 'order' | 'review' | 'category';
  entityId?: Types.ObjectId;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

type ActivityModel = Model<IActivity>;

const activitySchema = new Schema<IActivity>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: [
        'viewed_product',
        'added_to_cart',
        'placed_order',
        'order_status_changed',
        'wrote_review',
        'added_to_wishlist',
        'removed_from_wishlist',
        'bookmarked_product',
        'logged_in',
        'updated_profile',
      ],
      required: true,
    },
    description: { type: String, required: true, trim: true, maxlength: 300 },
    entityType: { type: String, enum: ['product', 'order', 'review', 'category'] },
    entityId: { type: Schema.Types.ObjectId },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Recent-activity feed: newest first, per user.
activitySchema.index({ user: 1, createdAt: -1 });

// Activity is a rolling feed, not permanent history - expire after 90 days to
// keep the collection from growing unbounded.
activitySchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

activitySchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default model<IActivity, ActivityModel>('Activity', activitySchema);
