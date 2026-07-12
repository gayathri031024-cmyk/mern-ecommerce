import { NextFunction, Request, Response } from 'express';

/**
 * Small in-memory response cache for public, read-heavy GET endpoints
 * (product listing/detail, category listing). Avoids re-hitting Mongo for
 * identical requests within the TTL window. This is process-local (fine
 * for a single instance; swap for Redis if you scale to multiple
 * instances and need a shared cache).
 */
interface CacheEntry {
  body: unknown;
  expiresAt: number;
}

const store = new Map<string, CacheEntry>();

function keyFor(req: Request): string {
  return `${req.baseUrl}${req.path}?${new URLSearchParams(req.query as Record<string, string>).toString()}`;
}

/** Purges every cached entry whose key starts with the given route prefix (e.g. '/api/products'). */
export function invalidateCache(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

/**
 * Caches successful (2xx) JSON GET responses for `ttlSeconds`, and sets a
 * `Cache-Control` header so browsers/CDNs can skip the round trip
 * entirely on repeat requests within the window.
 */
export function cacheGet(ttlSeconds: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.method !== 'GET') return next();

    const key = keyFor(req);
    const cached = store.get(key);
    res.set('Cache-Control', `public, max-age=${ttlSeconds}`);

    if (cached && cached.expiresAt > Date.now()) {
      res.set('X-Cache', 'HIT');
      res.json(cached.body);
      return;
    }

    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        store.set(key, { body, expiresAt: Date.now() + ttlSeconds * 1000 });
      }
      return originalJson(body);
    };

    res.set('X-Cache', 'MISS');
    next();
  };
}

/** Clears the whole prefix's cache after a mutating (non-GET) request succeeds. */
export function bustCacheOnMutation(prefix: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.method === 'GET') return next();
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) invalidateCache(prefix);
    });
    next();
  };
}
