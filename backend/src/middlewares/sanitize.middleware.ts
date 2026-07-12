import { NextFunction, Request, Response } from 'express';

/**
 * Strips script/style tags, HTML tags, event-handler attributes, and
 * javascript: URIs from a string. This is a defense-in-depth measure —
 * output encoding on the frontend (React escapes by default) is the
 * primary XSS defense, but we don't want raw <script> payloads sitting
 * in the database either (e.g. reviews, product titles, addresses).
 */
export function stripXss(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<\/?[a-z][\s\S]*?>/gi, '')
    .replace(/on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:text\/html/gi, '');
}

function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return stripXss(value);
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      result[key] = sanitizeValue(val);
    }
    return result;
  }

  return value;
}

/** Recursively sanitizes req.body, req.query, and req.params against XSS payloads. */
export function xssSanitize(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeValue(req.params) as Request['params'];
  }
  // req.query is a getter-only property on some Express/Node versions; mutate in place instead of reassigning.
  if (req.query && typeof req.query === 'object') {
    const sanitizedQuery = sanitizeValue(req.query) as Record<string, unknown>;
    for (const key of Object.keys(req.query)) delete (req.query as Record<string, unknown>)[key];
    Object.assign(req.query as Record<string, unknown>, sanitizedQuery);
  }
  next();
}
