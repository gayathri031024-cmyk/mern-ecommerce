import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { isProduction, env } from '@config/env';
import { AppError } from '@utils/AppError';
import { durationToMs } from '@services/token.service';

export const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Only /auth/refresh and /auth/logout are authenticated purely via the
 * httpOnly refresh cookie (every other route requires a Bearer access
 * token, which a cross-site request can't attach automatically). Those
 * two are the ones a forged cross-site request could otherwise trigger,
 * so they're the ones that need the double-submit CSRF check.
 */

/**
 * Ensures every client has a readable (non-httpOnly) CSRF token cookie.
 * The frontend echoes this value back as the `X-CSRF-Token` header on
 * state-changing requests; a cross-site attacker can't read the cookie
 * to forge that header, even though the browser auto-sends the cookie.
 */
export function issueCsrfCookie(req: Request, res: Response, next: NextFunction): void {
  if (!req.cookies?.[CSRF_COOKIE_NAME]) {
    const token = crypto.randomBytes(32).toString('hex');
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false,
      secure: isProduction,
      sameSite: 'lax',
      ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
      path: '/',
      maxAge: durationToMs(env.JWT_REFRESH_EXPIRES_IN),
    });

    req.cookies[CSRF_COOKIE_NAME] = token;
  }
  next();
}

/** Verifies the double-submit CSRF token for cookie-authenticated state-changing routes. */
export function verifyCsrfToken(req: Request, _res: Response, next: NextFunction): void {
  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME] as string | undefined;
  const headerToken = req.headers[CSRF_HEADER_NAME] as string | undefined;

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return next(AppError.forbidden('Invalid or missing CSRF token'));
  }
  next();
}
