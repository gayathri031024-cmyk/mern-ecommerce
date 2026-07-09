import { Request, Response } from 'express';
import Product from '../models/Product';
import { asyncHandler } from '../utils/asyncHandler';

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const sort = req.query.sort as string | undefined;

  const filter: Record<string, unknown> = {};
  if (sort === 'featured') filter.isFeatured = true;

  const [items, totalItems] = await Promise.all([
    Product.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: {
      items,
      meta: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit) || 1,
      },
    },
  });
});
