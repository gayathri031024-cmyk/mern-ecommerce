import { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import { AppError } from '@utils/AppError';

/** Validates that a route param is a well-formed Mongo ObjectId before it ever reaches a query. */
export function validateObjectIdParam(paramName = 'id') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const value = req.params[paramName];
    if (typeof value !== 'string' || !Types.ObjectId.isValid(value)) {
      throw AppError.badRequest(`Invalid ${paramName} format`);
    }
    next();
  };
}

/** Validates `{ ids: string[] }` bodies used by bulk update/delete endpoints. */
export function validateBulkIds(req: Request, _res: Response, next: NextFunction): void {
  const { ids } = req.body as { ids?: unknown };

  if (!Array.isArray(ids) || ids.length === 0) {
    throw AppError.badRequest('ids must be a non-empty array');
  }
  if (ids.length > 200) {
    throw AppError.badRequest('Cannot operate on more than 200 items at once');
  }
  const invalid = ids.filter((id) => typeof id !== 'string' || !Types.ObjectId.isValid(id));
  if (invalid.length) {
    throw AppError.badRequest('ids contains invalid ObjectId values', invalid);
  }
  next();
}