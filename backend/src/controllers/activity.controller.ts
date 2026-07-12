import { Request, Response } from 'express';
import Activity from '@models/Activity';
import { asyncHandler } from '@utils/asyncHandler';
import { getPagination, buildMeta } from '@utils/queryHelpers';

export const getMyActivity = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req, 15);
  const { type } = req.query;

  const filter: Record<string, unknown> = { user: req.user!.id };
  if (type) filter.type = type as string;

  const [items, totalItems] = await Promise.all([
    Activity.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Activity.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    message: 'Activity retrieved successfully',
    data: { items, meta: buildMeta(page, limit, totalItems) },
  });
});

export const clearMyActivity = asyncHandler(async (req: Request, res: Response) => {
  await Activity.deleteMany({ user: req.user!.id });
  res.status(200).json({ success: true, message: 'Activity history cleared' });
});
