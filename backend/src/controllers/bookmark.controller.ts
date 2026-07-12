import { Request, Response } from 'express';
import Bookmark from '@models/Bookmark';
import Product from '@models/Product';
import { asyncHandler } from '@utils/asyncHandler';
import { AppError } from '@utils/AppError';
import { logActivity } from '@services/activity.service';

export const getMyBookmarks = asyncHandler(async (req: Request, res: Response) => {
  const bookmarks = await Bookmark.find({ user: req.user!.id })
    .sort({ createdAt: -1 })
    .populate('product', 'title slug images price rating stock');

  res.status(200).json({ success: true, message: 'Bookmarks retrieved successfully', data: bookmarks });
});

export const addBookmark = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params;
  const { note } = req.body as { note?: string };

  const product = await Product.findById(productId);
  if (!product) throw AppError.notFound('Product not found');

  const existing = await Bookmark.findOne({ user: req.user!.id, product: productId });
  if (existing) throw AppError.conflict('Product is already bookmarked');

  const bookmark = await Bookmark.create({ user: req.user!.id, product: productId, note });
  await bookmark.populate('product', 'title slug images price rating stock');

  await logActivity({
    user: req.user!.id,
    type: 'bookmarked_product',
    description: `Bookmarked "${product.title}"`,
    entityType: 'product',
    entityId: product.id,
  });

  res.status(201).json({ success: true, message: 'Product bookmarked', data: bookmark });
});

export const removeBookmark = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params;

  const bookmark = await Bookmark.findOneAndDelete({ user: req.user!.id, product: productId });
  if (!bookmark) throw AppError.notFound('Bookmark not found');

  res.status(200).json({ success: true, message: 'Bookmark removed' });
});
