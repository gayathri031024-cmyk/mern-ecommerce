import { NextFunction, Request, Response } from 'express';
import { AppError } from '@utils/AppError';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function fail(errors: string[]): never {
  throw AppError.badRequest('Validation failed', errors);
}

export function validateRegister(req: Request, _res: Response, next: NextFunction): void {
  const { name, email, password, confirmPassword } = req.body as Record<string, unknown>;
  const errors: string[] = [];

  if (!isNonEmptyString(name)) errors.push('Name is required');
  if (!isNonEmptyString(email) || !EMAIL_REGEX.test(email)) errors.push('A valid email is required');
  if (!isNonEmptyString(password) || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (password !== confirmPassword) errors.push('Passwords do not match');

  if (errors.length) fail(errors);
  next();
}

export function validateLogin(req: Request, _res: Response, next: NextFunction): void {
  const { email, password } = req.body as Record<string, unknown>;
  const errors: string[] = [];

  if (!isNonEmptyString(email) || !EMAIL_REGEX.test(email)) errors.push('A valid email is required');
  if (!isNonEmptyString(password)) errors.push('Password is required');

  if (errors.length) fail(errors);
  next();
}

export function validateForgotPassword(req: Request, _res: Response, next: NextFunction): void {
  const { email } = req.body as Record<string, unknown>;
  const errors: string[] = [];

  if (!isNonEmptyString(email) || !EMAIL_REGEX.test(email)) errors.push('A valid email is required');

  if (errors.length) fail(errors);
  next();
}

export function validateResetPassword(req: Request, _res: Response, next: NextFunction): void {
  const { token, password } = req.body as Record<string, unknown>;
  const errors: string[] = [];

  if (!isNonEmptyString(token)) errors.push('Reset token is required');
  if (!isNonEmptyString(password) || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (errors.length) fail(errors);
  next();
}

export function validateVerifyEmail(req: Request, _res: Response, next: NextFunction): void {
  const token = (req.body as Record<string, unknown>).token ?? req.query.token;
  const errors: string[] = [];

  if (!isNonEmptyString(token)) errors.push('Verification token is required');

  if (errors.length) fail(errors);
  next();
}

export function validateResendVerification(req: Request, _res: Response, next: NextFunction): void {
  const { email } = req.body as Record<string, unknown>;
  const errors: string[] = [];

  if (!isNonEmptyString(email) || !EMAIL_REGEX.test(email)) errors.push('A valid email is required');

  if (errors.length) fail(errors);
  next();
}