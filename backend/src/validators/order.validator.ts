import { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import { AppError } from '@utils/AppError';

const PAYMENT_METHODS = ['card', 'cod', 'paypal'];
const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

export function validateCreateOrder(req: Request, _res: Response, next: NextFunction): void {
  const { shippingAddressId, paymentMethod } = req.body as Record<string, unknown>;
  const errors: string[] = [];

  if (!Types.ObjectId.isValid(shippingAddressId as string)) errors.push('A valid shippingAddressId is required');
  if (typeof paymentMethod !== 'string' || !PAYMENT_METHODS.includes(paymentMethod)) {
    errors.push(`paymentMethod must be one of: ${PAYMENT_METHODS.join(', ')}`);
  }

  if (errors.length) throw AppError.badRequest('Validation failed', errors);
  next();
}

export function validateUpdateOrderStatus(req: Request, _res: Response, next: NextFunction): void {
  const { status, note } = req.body as Record<string, unknown>;
  const errors: string[] = [];

  if (typeof status !== 'string' || !ORDER_STATUSES.includes(status)) {
    errors.push(`status must be one of: ${ORDER_STATUSES.join(', ')}`);
  }
  if (note !== undefined && typeof note !== 'string') errors.push('note must be a string');

  if (errors.length) throw AppError.badRequest('Validation failed', errors);
  next();
}

export function validateBulkStatusUpdate(req: Request, _res: Response, next: NextFunction): void {
  const { ids, status } = req.body as { ids?: unknown; status?: unknown };
  const errors: string[] = [];

  if (!Array.isArray(ids) || ids.length === 0) errors.push('ids must be a non-empty array');
  else {
    const invalid = (ids as unknown[]).filter((id) => typeof id !== 'string' || !Types.ObjectId.isValid(id));
    if (invalid.length) errors.push('ids contains invalid ObjectId values');
  }
  if (typeof status !== 'string' || !ORDER_STATUSES.includes(status)) {
    errors.push(`status must be one of: ${ORDER_STATUSES.join(', ')}`);
  }

  if (errors.length) throw AppError.badRequest('Validation failed', errors);
  next();
}