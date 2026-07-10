import { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import { AppError } from '@utils/AppError';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function validateCreateProduct(req: Request, _res: Response, next: NextFunction): void {
  const { title, slug, price, sku, category, stock, compareAtPrice, images } = req.body as Record<
    string,
    unknown
  >;
  const errors: string[] = [];

  if (!isNonEmptyString(title)) errors.push('Title is required');
  if (!isNonEmptyString(slug)) errors.push('Slug is required');
  if (!isNonEmptyString(sku)) errors.push('SKU is required');
  if (typeof price !== 'number' || price < 0) errors.push('Price must be a non-negative number');
  if (compareAtPrice !== undefined) {
    if (typeof compareAtPrice !== 'number' || compareAtPrice < 0) {
      errors.push('compareAtPrice must be a non-negative number');
    } else if (typeof price === 'number' && compareAtPrice <= price) {
      errors.push('compareAtPrice must be greater than price');
    }
  }
  if (stock !== undefined && (typeof stock !== 'number' || stock < 0)) {
    errors.push('Stock must be a non-negative number');
  }
  if (!isNonEmptyString(category as string) || !Types.ObjectId.isValid(category as string)) {
    errors.push('A valid category id is required');
  }
  if (images !== undefined && (!Array.isArray(images) || images.length > 10)) {
    errors.push('images must be an array of at most 10 items');
  }

  if (errors.length) throw AppError.badRequest('Validation failed', errors);
  next();
}

export function validateUpdateProduct(req: Request, _res: Response, next: NextFunction): void {
  const { price, compareAtPrice, stock, category, images } = req.body as Record<string, unknown>;
  const errors: string[] = [];

  if (price !== undefined && (typeof price !== 'number' || price < 0)) {
    errors.push('Price must be a non-negative number');
  }
  if (compareAtPrice !== undefined && compareAtPrice !== null) {
    if (typeof compareAtPrice !== 'number' || compareAtPrice < 0) {
      errors.push('compareAtPrice must be a non-negative number');
    }
  }
  if (stock !== undefined && (typeof stock !== 'number' || stock < 0)) {
    errors.push('Stock must be a non-negative number');
  }
  if (category !== undefined && !Types.ObjectId.isValid(category as string)) {
    errors.push('category must be a valid id');
  }
  if (images !== undefined && (!Array.isArray(images) || images.length > 10)) {
    errors.push('images must be an array of at most 10 items');
  }

  if (errors.length) throw AppError.badRequest('Validation failed', errors);
  next();
}

export function validateBulkStockUpdate(req: Request, _res: Response, next: NextFunction): void {
  const { updates } = req.body as { updates?: unknown };
  const errors: string[] = [];

  if (!Array.isArray(updates) || updates.length === 0) {
    errors.push('updates must be a non-empty array of { id, stock }');
  } else {
    for (const entry of updates as Record<string, unknown>[]) {
      if (!Types.ObjectId.isValid(entry.id as string)) errors.push(`Invalid product id: ${String(entry.id)}`);
      if (typeof entry.stock !== 'number' || entry.stock < 0) {
        errors.push(`Invalid stock value for product ${String(entry.id)}`);
      }
    }
  }

  if (errors.length) throw AppError.badRequest('Validation failed', errors);
  next();
}