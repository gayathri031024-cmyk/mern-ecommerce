import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { AppError } from '@utils/AppError';
import { logger } from '@utils/logger';
import { isProduction } from '@config/env';
import { ApiErrorResponse } from '../types/api';

interface NormalizedError { statusCode: number; message: string; details?: unknown; }

function normalizeError(err: unknown): NormalizedError {
  if (err instanceof AppError) return { statusCode: err.statusCode, message: err.message, details: err.details };

  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => e.message);
    return { statusCode: 400, message: 'Validation failed', details };
  }

  if (err instanceof mongoose.Error.CastError) {
    return { statusCode: 400, message: `Invalid value for field '${err.path}': ${err.value as string}` };
  }

  if (typeof err === 'object' && err !== null && 'code' in err && (err as { code?: number }).code === 11000) {
    const keyValue = (err as { keyValue?: Record<string, unknown> }).keyValue;
    return { statusCode: 409, message: 'Duplicate field value', details: keyValue };
  }

  if (err instanceof SyntaxError && 'body' in err) {
    return { statusCode: 400, message: 'Malformed JSON in request body' };
  }

  if (err instanceof Error) return { statusCode: 500, message: err.message };
  return { statusCode: 500, message: 'Something went wrong' };
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const { statusCode, message, details } = normalizeError(err);
  const isOperational = err instanceof AppError ? err.isOperational : false;

  if (!isOperational) logger.error(`Unhandled error on ${req.method} ${req.originalUrl}`, err);
  else logger.warn(`${req.method} ${req.originalUrl} -> ${statusCode} ${message}`, { requestId: req.requestId });

  const response: ApiErrorResponse = {
    success: false,
    message,
    ...(details !== undefined ? { errors: details } : {}),
    ...(!isProduction && err instanceof Error ? { stack: err.stack } : {}),
  };

  res.status(statusCode).json(response);
}