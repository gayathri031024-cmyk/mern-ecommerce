import { Schema, model, Document, Model, Types } from 'mongoose';
import { softDeletePlugin, SoftDeleteFields, SoftDeleteMethods } from './softDelete.plugin';
import Product from './Product';

export interface IReview extends Document, SoftDeleteFields, SoftDeleteMethods {
  product: Types.ObjectId;
  user: Types.ObjectId;
  rating: number;
  comment: string;
  isVerifiedPurchase: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ReviewModel extends Model<IReview> {
  findDeleted(filter?: Record<string, unknown>): ReturnType<Model<IReview>['find']>;
  findWithDeleted(filter?: Record<string, unknown>): ReturnType<Model<IReview>['find']>;
  recalculateProductRating(productId: Types.ObjectId): Promise<void>;
}

const reviewSchema = new Schema<IReview>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 2000 },
    isVerifiedPurchase: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// One review per user per product (among live reviews) — resubmission requires
// editing the existing review rather than creating a duplicate.
reviewSchema.index(
  { product: 1, user: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);
reviewSchema.index({ product: 1, createdAt: -1 });

/** Recomputes and persists the denormalized rating/reviewCount on the parent Product. */
reviewSchema.statics.recalculateProductRating = async function (productId: Types.ObjectId) {
  const [stats] = await this.aggregate([
    { $match: { product: productId, isDeleted: false } },
    { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  await Product.findByIdAndUpdate(productId, {
    rating: stats ? Math.round(stats.avgRating * 10) / 10 : 0,
    reviewCount: stats ? stats.count : 0,
  });
};

reviewSchema.post('save', function (doc) {
  (doc.constructor as ReviewModel).recalculateProductRating(doc.product as Types.ObjectId);
});

reviewSchema.plugin(softDeletePlugin);

reviewSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default model<IReview, ReviewModel>('Review', reviewSchema);
