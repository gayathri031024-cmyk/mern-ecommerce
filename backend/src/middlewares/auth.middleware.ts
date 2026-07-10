import { NextFunction, Request, Response } from 'express';
import { AppError } from '@utils/AppError';
import { verifyAccessToken } from '@services/token.service';
import { Role } from '@constants/roles';

function extractBearerToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.slice('Bearer '.length);
  return undefined;
}

/** Verifies the JWT access token and attaches the authenticated user to the request. */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const token = extractBearerToken(req);

  if (!token) {
    return next(AppError.unauthorized('Authentication required'));
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role, email: payload.email };
    next();
  } catch {
    next(AppError.unauthorized('Invalid or expired token'));
  }
}

/** Restricts a route to the given roles. Use after `authenticate`. */
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized('Authentication required'));
    }
    if (!allowedRoles.includes(req.user.role as Role)) {
      return next(AppError.forbidden('You do not have permission to perform this action'));
    }
    next();
  };
}
