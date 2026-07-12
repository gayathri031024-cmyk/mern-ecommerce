import { Request, Response } from 'express';
import User from '@models/User';
import { asyncHandler } from '@utils/asyncHandler';
import { AppError } from '@utils/AppError';
import { getPagination, buildMeta } from '@utils/queryHelpers';
import { logActivity } from '@services/activity.service';

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id);
  if (!user) throw AppError.notFound('User not found');

  res.status(200).json({ success: true, message: 'Current user retrieved successfully', data: user.toJSON() });
});

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const { name, phone, avatarUrl } = req.body as { name?: string; phone?: string; avatarUrl?: string };

  const user = await User.findById(req.user!.id);
  if (!user) throw AppError.notFound('User not found');

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
  await user.save();

  void logActivity({ user: user.id, type: 'updated_profile', description: 'Updated profile details' });

  res.status(200).json({ success: true, message: 'Profile updated successfully', data: user.toJSON() });
});

export const addAddress = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id);
  if (!user) throw AppError.notFound('User not found');

  user.addresses.push(req.body);
  await user.save();

  res.status(201).json({ success: true, message: 'Address added successfully', data: user.toJSON() });
});

export const updateAddress = asyncHandler(async (req: Request, res: Response) => {
  const addressId = String(req.params.addressId);

  const user = await User.findById(req.user!.id);
  if (!user) throw AppError.notFound('User not found');

  const address = user.addresses.id(addressId);
  if (!address) throw AppError.notFound('Address not found');

  address.set(req.body);
  await user.save();

  res.status(200).json({ success: true, message: 'Address updated successfully', data: user.toJSON() });
});

export const removeAddress = asyncHandler(async (req: Request, res: Response) => {
  const addressId = String(req.params.addressId);

  const user = await User.findById(req.user!.id);
  if (!user) throw AppError.notFound('User not found');

  const address = user.addresses.id(addressId);
  if (!address) throw AppError.notFound('Address not found');

  user.addresses.pull(addressId);
  await user.save();

  res.status(200).json({ success: true, message: 'Address removed successfully', data: user.toJSON() });
});

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const { role, search } = req.query;

  const filter: Record<string, unknown> = {};
  if (role) filter.role = role as string;
  if (search) {
    filter.$or = [
      { name: new RegExp(search as string, 'i') },
      { email: new RegExp(search as string, 'i') },
    ];
  }

  const [items, totalItems] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    message: 'Users retrieved successfully',
    data: items,
    meta: buildMeta(page, limit, totalItems),
  });
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id);
  if (!user) throw AppError.notFound('User not found');

  res.status(200).json({ success: true, message: 'User retrieved successfully', data: user.toJSON() });
});

export const updateUserRole = asyncHandler(async (req: Request, res: Response) => {
  const { role } = req.body as { role: string };

  const user = await User.findById(req.params.id);
  if (!user) throw AppError.notFound('User not found');

  user.role = role as typeof user.role;
  await user.save();

  res.status(200).json({ success: true, message: 'User role updated successfully', data: user.toJSON() });
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id);
  if (!user) throw AppError.notFound('User not found');

  await user.softDelete(req.user?.id);

  res.status(200).json({ success: true, message: 'User deleted successfully' });
});