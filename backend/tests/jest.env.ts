// Runs before the test framework and any application module is imported.
// Provides the required env vars so `src/config/env.ts`'s validation passes,
// and forces predictable, non-production values for the whole test run.
// The actual Mongo connection is swapped for an in-memory server in
// `tests/helpers/db.ts` — MONGO_URI below is a placeholder only.
process.env.NODE_ENV = 'test';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/test-placeholder';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-do-not-use-in-prod';
process.env.JWT_ACCESS_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-do-not-use-in-prod';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.COOKIE_DOMAIN = 'localhost';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.RATE_LIMIT_WINDOW_MS = '900000';
process.env.RATE_LIMIT_MAX_REQUESTS = '10000';
process.env.EMAIL_FROM = 'noreply@ecommerce.test';
