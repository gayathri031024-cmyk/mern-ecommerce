import { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import { AppError } from '@utils/AppError';

export function validateCreateReview(req: Request, _res: Response, next: NextFunction): void {
  const { productId, rating, comment } = req.body as Record<string, unknown>;
  const errors: string[] = [];

  if (!Types.ObjectId.isValid(productId as string)) errors.push('A valid productId is required');
  if (typeof rating !== 'number' || rating < 1 || rating > 5) errors.push('Rating must be a number between 1 and 5');
  if (typeof comment !== 'string' || !comment.trim() || comment.length > 2000) {
    errors.push('Comment is required (max 2000 chars)');
  }

  if (errors.length) throw AppError.badRequest('Validation failed', errors);
  next();
}

export function validateUpdateReview(req: Request, _res: Response, next: NextFunction): void {
  const { rating, comment } = req.body as Record<string, unknown>;
  const errors: string[] = [];

  if (rating !== undefined && (typeof rating !== 'number' || rating < 1 || rating > 5)) {
    errors.push('Rating must be a number between 1 and 5');
  }
  if (comment !== undefined && (typeof comment !== 'string' || !comment.trim() || comment.length > 2000)) {
    errors.push('Comment must be a non-empty string (max 2000 chars)');
  }

  if (errors.length) throw AppError.badRequest('Validation failed', errors);
  next();
}