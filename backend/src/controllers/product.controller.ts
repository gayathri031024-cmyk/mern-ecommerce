import { Request, Response } from 'express';
import { FilterQuery, SortOrder } from 'mongoose';
import Product, { IProduct } from '@models/Product';
import Category from '@models/Category';
import { ROLES } from '@constants/roles';
import { asyncHandler } from '@utils/asyncHandler';
import { AppError } from '@utils/AppError';
import { getPagination, buildMeta } from '@utils/queryHelpers';

const SORT_MAP: Record<string, Record<string, SortOrder>> = {
  featured: { isFeatured: -1, createdAt: -1 },
  newest: { createdAt: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  rating: { rating: -1 },
};

function buildListFilter(req: Request): FilterQuery<IProduct> {
  const { category, minPrice, maxPrice, brand, rating, inStock, search } = req.query;
  const filter: FilterQuery<IProduct> = { isActive: true };

  if (category) filter.category = category as string;
  if (brand) filter.brand = new RegExp(`^${brand}$`, 'i');
  if (rating) filter.rating = { $gte: Number(rating) };
  if (inStock === 'true') filter.stock = { $gt: 0 };
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  if (search) filter.$text = { $search: search as string };

  return filter;
}

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const sort = req.query.sort as string | undefined;
  const search = req.query.search as string | undefined;
  const filter = buildListFilter(req);

  // Text search relevance takes priority over any requested sort since a
  // keyword query implies "best match first".
  const sortStage: Record<string, SortOrder> = search
    ? { score: { $meta: 'textScore' } as unknown as SortOrder }
    : (sort && SORT_MAP[sort]) || SORT_MAP.newest;

  const projection = search ? { score: { $meta: 'textScore' } } : undefined;

  const [items, totalItems] = await Promise.all([
    Product.find(filter, projection)
      .populate('category', 'name slug')
      .sort(sortStage)
      .skip(skip)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    message: 'Products retrieved successfully',
    data: { items, meta: buildMeta(page, limit, totalItems) },
  });
});

export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findById(req.params.id).populate('category', 'name slug');
  if (!product) throw AppError.notFound('Product not found');

  res.status(200).json({ success: true, message: 'Product retrieved successfully', data: product });
});

export const getProductBySlug = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findOne({ slug: req.params.slug }).populate('category', 'name slug');
  if (!product) throw AppError.notFound('Product not found');

  res.status(200).json({ success: true, message: 'Product retrieved successfully', data: product });
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as Partial<IProduct> & { category: string };

  const category = await Category.findById(body.category);
  if (!category) throw AppError.badRequest('category does not exist');

  const existingSku = await Product.findOne({ sku: body.sku });
  if (existingSku) throw AppError.conflict('A product with this SKU already exists');
  const existingSlug = await Product.findOne({ slug: body.slug });
  if (existingSlug) throw AppError.conflict('A product with this slug already exists');

  // Vendors can only create products under their own account, regardless of
  // what vendor id (if any) they send in the body.
  const vendor = req.user?.role === ROLES.VENDOR ? req.user.id : body.vendor;

  const product = await Product.create({ ...body, vendor });

  res.status(201).json({ success: true, message: 'Product created successfully', data: product });
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw AppError.notFound('Product not found');

  if (req.user?.role === ROLES.VENDOR && String(product.vendor) !== req.user.id) {
    throw AppError.forbidden('You can only modify your own products');
  }

  const updates = req.body as Partial<IProduct>;

  if (updates.sku && updates.sku !== product.sku) {
    const taken = await Product.findOne({ sku: updates.sku, _id: { $ne: product.id } });
    if (taken) throw AppError.conflict('A product with this SKU already exists');
  }
  if (updates.slug && updates.slug !== product.slug) {
    const taken = await Product.findOne({ slug: updates.slug, _id: { $ne: product.id } });
    if (taken) throw AppError.conflict('A product with this slug already exists');
  }
  if (updates.category) {
    const category = await Category.findById(updates.category);
    if (!category) throw AppError.badRequest('category does not exist');
  }

  Object.assign(product, updates);
  await product.save();

  res.status(200).json({ success: true, message: 'Product updated successfully', data: product });
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw AppError.notFound('Product not found');

  if (req.user?.role === ROLES.VENDOR && String(product.vendor) !== req.user.id) {
    throw AppError.forbidden('You can only delete your own products');
  }

  await product.softDelete(req.user?.id);

  res.status(200).json({ success: true, message: 'Product deleted successfully' });
});

export const bulkDeleteProducts = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body as { ids: string[] };

  const filter: FilterQuery<IProduct> =
    req.user?.role === ROLES.VENDOR ? { _id: { $in: ids }, vendor: req.user.id } : { _id: { $in: ids } };

  const result = await Product.updateMany(filter, {
    isDeleted: true,
    deletedAt: new Date(),
    deletedBy: req.user?.id,
  });

  res.status(200).json({
    success: true,
    message: `${result.modifiedCount} product${result.modifiedCount === 1 ? '' : 's'} deleted`,
    data: { deletedCount: result.modifiedCount },
  });
});

export const bulkUpdateStock = asyncHandler(async (req: Request, res: Response) => {
  const { updates } = req.body as { updates: { id: string; stock: number }[] };

  const results = await Promise.all(
    updates.map(({ id, stock }) => Product.findByIdAndUpdate(id, { stock }, { new: true, runValidators: true })),
  );

  const notFound = updates.filter((_u, i) => !results[i]).map((u) => u.id);

  res.status(200).json({
    success: true,
    message: `${results.filter(Boolean).length} product${results.length === 1 ? '' : 's'} updated`,
    data: { updatedCount: results.filter(Boolean).length, notFound },
  });
});