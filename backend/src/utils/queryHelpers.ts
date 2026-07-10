import { Request } from 'express';
 
export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}
 
const MAX_LIMIT = 100;
 
/** Parses & clamps page/limit query params so a client can't request an unbounded page size. */
export function getPagination(req: Request, defaultLimit = 20): PaginationParams {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(req.query.limit) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}
 
export function buildMeta(page: number, limit: number, totalItems: number) {
  return {
    page,
    limit,
    totalItems,
    totalPages: Math.ceil(totalItems / limit) || 1,
  };
}
 
/**
 * Builds a Mongoose sort object from a `sort` query param against a whitelist,
 * e.g. sort=price,-createdAt -> { price: 1, createdAt: -1 }.
 * Prevents sorting on arbitrary/unindexed fields a client could pass in.
 */
export function buildSort(
  sortParam: unknown,
  allowedFields: string[],
  fallback: Record<string, 1 | -1> = { createdAt: -1 },
): Record<string, 1 | -1> {
  if (typeof sortParam !== 'string' || !sortParam.trim()) return fallback;
 
  const sort: Record<string, 1 | -1> = {};
  for (const raw of sortParam.split(',')) {
    const desc = raw.startsWith('-');
    const field = desc ? raw.slice(1) : raw;
    if (allowedFields.includes(field)) sort[field] = desc ? -1 : 1;
  }
  return Object.keys(sort).length ? sort : fallback;
}