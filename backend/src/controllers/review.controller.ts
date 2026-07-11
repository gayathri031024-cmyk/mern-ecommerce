import { Types } from 'mongoose';
import { Request, Response } from 'express';
import Review from '@models/Review';
import Order from '@models/Order';
import { ROLES } from '@constants/roles';
import { asyncHandler } from '@utils/asyncHandler';
import { AppError } from '@utils/AppError';
import { getPagination, buildMeta, buildSort } from '@utils/queryHelpers';
import { logActivity } from '@services/activity.service';

const SORTABLE_FIELDS = ['createdAt', 'rating'];

export const getProductReviews = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const sort = buildSort(req.query.sort, SORTABLE_FIELDS);

  const filter = { product: req.params.productId };
  const [items, totalItems] = await Promise.all([
    Review.find(filter).populate('user', 'name avatarUrl').sort(sort).skip(skip).limit(limit),
    Review.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    message: 'Reviews retrieved successfully',
    data: { items, meta: buildMeta(page, limit, totalItems) },
  });
});

export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const { productId, rating, comment } = req.body as { productId: string; rating: number; comment: string };
  const userId = req.user!.id;

  const existing = await Review.findOne({ product: productId, user: userId });
  if (existing) throw AppError.conflict('You have already reviewed this product');

  // A review counts as a verified purchase if the user has a delivered order
  // containing this product.
  const hasPurchased = await Order.exists({
    user: userId,
    status: 'delivered',
    'items.product': productId,
  });

  const review = await Review.create({
    product: productId,
    user: userId,
    rating,
    comment,
    isVerifiedPurchase: Boolean(hasPurchased),
  });

  void logActivity({
    user: userId,
    type: 'wrote_review',
    description: `Wrote a ${rating}-star review`,
    entityType: 'product',
    entityId: productId,
  });

  res.status(201).json({ success: true, message: 'Review submitted successfully', data: review });
});

export const updateReview = asyncHandler(async (req: Request, res: Response) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw AppError.notFound('Review not found');

  if (String(review.user) !== req.user!.id) {
    throw AppError.forbidden('You can only edit your own review');
  }

  const { rating, comment } = req.body as Partial<{ rating: number; comment: string }>;
  if (rating !== undefined) review.rating = rating;
  if (comment !== undefined) review.comment = comment;
  await review.save();

  res.status(200).json({ success: true, message: 'Review updated successfully', data: review });
});

export const deleteReview = asyncHandler(async (req: Request, res: Response) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw AppError.notFound('Review not found');

  const isOwner = String(review.user) === req.user!.id;
  const isAdmin = req.user!.role === ROLES.ADMIN;
  if (!isOwner && !isAdmin) throw AppError.forbidden('You do not have permission to delete this review');

  await review.softDelete(req.user!.id);
  await Review.recalculateProductRating(review.product);

  res.status(200).json({ success: true, message: 'Review deleted successfully' });
});

export const bulkDeleteReviews = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body as { ids: string[] };

  const reviews = await Review.find({ _id: { $in: ids } }, 'product');
  const result = await Review.updateMany(
    { _id: { $in: ids } },
    { isDeleted: true, deletedAt: new Date(), deletedBy: req.user?.id },
  );

  const affectedProducts = [...new Set(reviews.map((r) => String(r.product)))];
  await Promise.all(
    affectedProducts.map((productId) => Review.recalculateProductRating(new Types.ObjectId(productId))),
  );

  res.status(200).json({
    success: true,
    message: `${result.modifiedCount} review${result.modifiedCount === 1 ? '' : 's'} deleted`,
    data: { deletedCount: result.modifiedCount },
  });
});