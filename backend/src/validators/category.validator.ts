import { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import { AppError } from '@utils/AppError';
 
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
 
function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
 
export function validateCreateCategory(req: Request, _res: Response, next: NextFunction): void {
  const { name, slug, description, imageUrl, parent } = req.body as Record<string, unknown>;
  const errors: string[] = [];
 
  if (!isNonEmptyString(name) || name.length > 100) errors.push('Name is required (max 100 chars)');
  if (!isNonEmptyString(slug) || !SLUG_REGEX.test(slug)) {
    errors.push('Slug is required and must be lowercase, alphanumeric and hyphenated');
  }
  if (description !== undefined && typeof description !== 'string') errors.push('Description must be a string');
  if (imageUrl !== undefined && typeof imageUrl !== 'string') errors.push('imageUrl must be a string');
  if (parent !== undefined && parent !== null && !Types.ObjectId.isValid(parent as string)) {
    errors.push('parent must be a valid category id');
  }
 
  if (errors.length) throw AppError.badRequest('Validation failed', errors);
  next();
}
 
export function validateUpdateCategory(req: Request, _res: Response, next: NextFunction): void {
  const { name, slug, description, imageUrl, parent, isActive } = req.body as Record<string, unknown>;
  const errors: string[] = [];
 
  if (name !== undefined && (!isNonEmptyString(name) || name.length > 100)) {
    errors.push('Name must be a non-empty string (max 100 chars)');
  }
  if (slug !== undefined && (!isNonEmptyString(slug) || !SLUG_REGEX.test(slug))) {
    errors.push('Slug must be lowercase, alphanumeric and hyphenated');
  }
  if (description !== undefined && typeof description !== 'string') errors.push('Description must be a string');
  if (imageUrl !== undefined && typeof imageUrl !== 'string') errors.push('imageUrl must be a string');
  if (parent !== undefined && parent !== null && !Types.ObjectId.isValid(parent as string)) {
    errors.push('parent must be a valid category id');
  }
  if (isActive !== undefined && typeof isActive !== 'boolean') errors.push('isActive must be a boolean');
 
  if (errors.length) throw AppError.badRequest('Validation failed', errors);
  next();
}