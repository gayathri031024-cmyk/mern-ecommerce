import { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import { AppError } from '@utils/AppError';

export function validateAddCartItem(req: Request, _res: Response, next: NextFunction): void {
  const { productId, quantity } = req.body as Record<string, unknown>;
  const errors: string[] = [];

  if (!Types.ObjectId.isValid(productId as string)) errors.push('A valid productId is required');
  if (quantity !== undefined && (typeof quantity !== 'number' || quantity < 1 || quantity > 99)) {
    errors.push('quantity must be a number between 1 and 99');
  }

  if (errors.length) throw AppError.badRequest('Validation failed', errors);
  next();
}

export function validateUpdateCartItem(req: Request, _res: Response, next: NextFunction): void {
  const { quantity } = req.body as Record<string, unknown>;
  const errors: string[] = [];

  if (typeof quantity !== 'number' || quantity < 1 || quantity > 99) {
    errors.push('quantity is required and must be a number between 1 and 99');
  }

  if (errors.length) throw AppError.badRequest('Validation failed', errors);
  next();
}

export function validateMergeCart(req: Request, _res: Response, next: NextFunction): void {
  const { items } = req.body as { items?: unknown };
  const errors: string[] = [];

  if (!Array.isArray(items)) {
    errors.push('items must be an array of { productId, quantity }');
  } else {
    for (const entry of items as Record<string, unknown>[]) {
      if (!Types.ObjectId.isValid(entry.productId as string)) {
        errors.push(`Invalid productId: ${String(entry.productId)}`);
      }
      if (typeof entry.quantity !== 'number' || entry.quantity < 1 || entry.quantity > 99) {
        errors.push(`Invalid quantity for product ${String(entry.productId)}`);
      }
    }
  }

  if (errors.length) throw AppError.badRequest('Validation failed', errors);
  next();
}