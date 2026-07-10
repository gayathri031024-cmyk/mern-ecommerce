import { Request, Response } from 'express';
import { FilterQuery } from 'mongoose';
import Category, { ICategory } from '@models/Category';
import Product from '@models/Product';
import { asyncHandler } from '@utils/asyncHandler';
import { AppError } from '@utils/AppError';
import { getPagination, buildMeta, buildSort } from '@utils/queryHelpers';

const SORTABLE_FIELDS = ['name', 'createdAt', 'productCount'];

export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const sort = buildSort(req.query.sort, SORTABLE_FIELDS, { name: 1 });
  const { search, parent, isActive } = req.query;

  const filter: FilterQuery<ICategory> = {};
  if (search) filter.$text = { $search: search as string };
  if (parent === 'null') filter.parent = null;
  else if (typeof parent === 'string') filter.parent = parent;
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const [items, totalItems] = await Promise.all([
    Category.find(filter).populate('parent', 'name slug').sort(sort).skip(skip).limit(limit),
    Category.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    message: 'Categories retrieved successfully',
    data: { items, meta: buildMeta(page, limit, totalItems) },
  });
});

export const getCategoryById = asyncHandler(async (req: Request, res: Response) => {
  const category = await Category.findById(req.params.id).populate('parent', 'name slug');
  if (!category) throw AppError.notFound('Category not found');

  res.status(200).json({ success: true, message: 'Category retrieved successfully', data: category });
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const { name, slug, description, imageUrl, parent } = req.body as {
    name: string;
    slug: string;
    description?: string;
    imageUrl?: string;
    parent?: string | null;
  };

  if (parent) {
    const parentExists = await Category.findById(parent);
    if (!parentExists) throw AppError.badRequest('parent category does not exist');
  }

  const existing = await Category.findOne({ slug });
  if (existing) throw AppError.conflict('A category with this slug already exists');

  const category = await Category.create({ name, slug, description, imageUrl, parent: parent || null });

  res.status(201).json({ success: true, message: 'Category created successfully', data: category });
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body as Partial<ICategory>;

  if (updates.parent && String(updates.parent) === id) {
    throw AppError.badRequest('A category cannot be its own parent');
  }

  if (updates.slug) {
    const slugTaken = await Category.findOne({ slug: updates.slug, _id: { $ne: id } });
    if (slugTaken) throw AppError.conflict('A category with this slug already exists');
  }

  const category = await Category.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  if (!category) throw AppError.notFound('Category not found');

  res.status(200).json({ success: true, message: 'Category updated successfully', data: category });
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw AppError.notFound('Category not found');

  const [productCount, childCount] = await Promise.all([
    Product.countDocuments({ category: category.id }),
    Category.countDocuments({ parent: category.id }),
  ]);
  if (productCount > 0) throw AppError.conflict('Cannot delete a category that still has products assigned');
  if (childCount > 0) throw AppError.conflict('Cannot delete a category that still has subcategories');

  await category.softDelete(req.user?.id);

  res.status(200).json({ success: true, message: 'Category deleted successfully' });
});

export const bulkDeleteCategories = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body as { ids: string[] };

  const blocked = await Product.distinct('category', { category: { $in: ids } });
  const deletable = ids.filter((id) => !blocked.map(String).includes(id));

  const result = await Category.updateMany(
    { _id: { $in: deletable } },
    { isDeleted: true, deletedAt: new Date(), deletedBy: req.user?.id },
  );

  res.status(200).json({
    success: true,
    message: `${result.modifiedCount} categor${result.modifiedCount === 1 ? 'y' : 'ies'} deleted`,
    data: {
      deletedCount: result.modifiedCount,
      skipped: ids.filter((id) => !deletable.includes(id)),
    },
  });
});