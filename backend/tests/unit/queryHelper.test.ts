import { Request } from 'express';
import { getPagination, buildMeta, buildSort } from '@utils/queryHelpers';

function mockRequest(query: Record<string, unknown>): Request {
  return { query } as unknown as Request;
}

describe('getPagination', () => {
  it('defaults to page 1 and the given default limit when no query params are present', () => {
    const result = getPagination(mockRequest({}), 20);
    expect(result).toEqual({ page: 1, limit: 20, skip: 0 });
  });

  it('parses page and limit from query params and computes skip', () => {
    const result = getPagination(mockRequest({ page: '3', limit: '10' }));
    expect(result).toEqual({ page: 3, limit: 10, skip: 20 });
  });

  it('clamps limit to the maximum of 100', () => {
    const result = getPagination(mockRequest({ limit: '500' }));
    expect(result.limit).toBe(100);
  });

  it('clamps page to a minimum of 1 for zero or negative values', () => {
    expect(getPagination(mockRequest({ page: '0' })).page).toBe(1);
    expect(getPagination(mockRequest({ page: '-5' })).page).toBe(1);
  });

  it('clamps an explicit limit=0 to 1 instead of silently falling back to the default', () => {
    // Regression test: `Number(x) || defaultLimit` used to treat 0 as falsy
    // and mask an explicit `?limit=0` with the default limit.
    expect(getPagination(mockRequest({ limit: '0' })).limit).toBe(1);
  });

  it('falls back to the default limit for non-numeric values', () => {
    expect(getPagination(mockRequest({ limit: 'abc' })).limit).toBe(20);
  });

  it('clamps a negative limit up to 1', () => {
    expect(getPagination(mockRequest({ limit: '-5' })).limit).toBe(1);
  });
});

describe('buildMeta', () => {
  it('computes totalPages by rounding up totalItems / limit', () => {
    expect(buildMeta(1, 10, 25)).toEqual({ page: 1, limit: 10, totalItems: 25, totalPages: 3 });
  });

  it('returns at least 1 total page when there are zero items', () => {
    expect(buildMeta(1, 10, 0)).toEqual({ page: 1, limit: 10, totalItems: 0, totalPages: 1 });
  });

  it('returns exactly 1 page when totalItems evenly divides limit', () => {
    expect(buildMeta(1, 10, 10).totalPages).toBe(1);
  });
});

describe('buildSort', () => {
  const allowed = ['createdAt', 'price', 'title'];

  it('returns the fallback when sortParam is not a string', () => {
    expect(buildSort(undefined, allowed)).toEqual({ createdAt: -1 });
    expect(buildSort(null, allowed)).toEqual({ createdAt: -1 });
  });

  it('returns the fallback when sortParam is an empty/whitespace string', () => {
    expect(buildSort('   ', allowed)).toEqual({ createdAt: -1 });
  });

  it('parses a single ascending field', () => {
    expect(buildSort('price', allowed)).toEqual({ price: 1 });
  });

  it('parses a descending field prefixed with a dash', () => {
    expect(buildSort('-price', allowed)).toEqual({ price: -1 });
  });

  it('parses multiple comma-separated fields', () => {
    expect(buildSort('price,-createdAt', allowed)).toEqual({ price: 1, createdAt: -1 });
  });

  it('silently drops fields that are not in the allow-list', () => {
    expect(buildSort('price,secretField', allowed)).toEqual({ price: 1 });
  });

  it('falls back when every requested field is disallowed', () => {
    expect(buildSort('secretField', allowed)).toEqual({ createdAt: -1 });
  });

  it('accepts a custom fallback', () => {
    expect(buildSort('secretField', allowed, { title: 1 })).toEqual({ title: 1 });
  });
});
