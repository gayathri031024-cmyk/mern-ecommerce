import { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import { AppError } from '@utils/AppError';

export function validateProductIdParam(req: Request, _res: Response, next: NextFunction): void {
  const { productId } = req.params;
  if (typeof productId !== 'string' || !Types.ObjectId.isValid(productId)) {
    throw AppError.badRequest('Invalid productId format');
  }
  next();
}

export function validateBulkProductIds(req: Request, _res: Response, next: NextFunction): void {
  const { productIds } = req.body as { productIds?: unknown };

  if (!Array.isArray(productIds) || productIds.length === 0) {
    throw AppError.badRequest('productIds must be a non-empty array');
  }
  const invalid = productIds.filter((id) => typeof id !== 'string' || !Types.ObjectId.isValid(id));
  if (invalid.length) throw AppError.badRequest('productIds contains invalid ObjectId values', invalid);

  next();
}