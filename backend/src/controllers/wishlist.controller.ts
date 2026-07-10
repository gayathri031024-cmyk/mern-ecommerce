import { Request, Response } from 'express';
import Wishlist from '@models/Wishlist';
import Product from '@models/Product';
import { asyncHandler } from '@utils/asyncHandler';
import { AppError } from '@utils/AppError';

async function getOrCreateWishlist(userId: string) {
  let wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) wishlist = await Wishlist.create({ user: userId, products: [] });
  return wishlist;
}

export const getWishlist = asyncHandler(async (req: Request, res: Response) => {
  const wishlist = await (
    await getOrCreateWishlist(req.user!.id)
  ).populate('products', 'title slug images price rating stock');

  res.status(200).json({ success: true, message: 'Wishlist retrieved successfully', data: wishlist });
});

export const addToWishlist = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params;

  const product = await Product.findById(productId);
  if (!product) throw AppError.notFound('Product not found');

  const wishlist = await getOrCreateWishlist(req.user!.id);
  if (!wishlist.products.some((p) => String(p) === productId)) {
    wishlist.products.push(product._id as never);
    await wishlist.save();
  }
  await wishlist.populate('products', 'title slug images price rating stock');

  res.status(200).json({ success: true, message: 'Product added to wishlist', data: wishlist });
});

export const removeFromWishlist = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params;

  const wishlist = await getOrCreateWishlist(req.user!.id);
  wishlist.products = wishlist.products.filter((p) => String(p) !== productId) as never;
  await wishlist.save();
  await wishlist.populate('products', 'title slug images price rating stock');

  res.status(200).json({ success: true, message: 'Product removed from wishlist', data: wishlist });
});

export const clearWishlist = asyncHandler(async (req: Request, res: Response) => {
  const wishlist = await getOrCreateWishlist(req.user!.id);
  wishlist.products = [] as never;
  await wishlist.save();

  res.status(200).json({ success: true, message: 'Wishlist cleared', data: wishlist });
});

/** Bulk-adds product ids, e.g. merging a guest wishlist from localStorage on login. */
export const bulkAddToWishlist = asyncHandler(async (req: Request, res: Response) => {
  const { productIds } = req.body as { productIds: string[] };

  const validProducts = await Product.find({ _id: { $in: productIds } }, '_id');
  const validIds = validProducts.map((p) => String(p._id));

  const wishlist = await getOrCreateWishlist(req.user!.id);
  const existing = new Set(wishlist.products.map(String));
  const toAdd = validIds.filter((id) => !existing.has(id));

  wishlist.products.push(...(toAdd as unknown as never[]));
  await wishlist.save();
  await wishlist.populate('products', 'title slug images price rating stock');

  res.status(200).json({
    success: true,
    message: `${toAdd.length} product${toAdd.length === 1 ? '' : 's'} added to wishlist`,
    data: wishlist,
  });
});