# Swagger Documentation

The backend serves live, interactive API documentation using `swagger-ui-express`.

## Where it lives

| What | Where |
|---|---|
| OpenAPI 3.0 spec (source of truth) | `backend/docs/openapi.json` |
| Wiring into the Express app | `backend/src/app.ts` |
| Interactive UI | `GET /api-docs` (e.g. `http://localhost:5000/api-docs`) |
| Raw spec as JSON | `GET /api-docs.json` |

## How it's wired

```ts
import swaggerUi from 'swagger-ui-express';
const openapiSpec = require('../docs/openapi.json');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));
app.get('/api-docs.json', (_req, res) => res.json(openapiSpec));
```

The spec is loaded once at startup via `require`, not `import` — `backend/docs/` sits outside `tsconfig.json`'s `rootDir` (`./src`), so a static `import ... from '../docs/openapi.json'` would fail TypeScript's `rootDir` check. `require()` sidesteps that (it's resolved at runtime, not type-checked), and the relative path `../docs/openapi.json` resolves correctly both in dev (`src/app.ts` → `src/../docs`) and from the compiled build (`dist/app.js` → `dist/../docs`), since `docs/` is a sibling of both `src/` and `dist/`.

## What's documented

All 13 resource groups (Auth, Users, Products, Categories, Reviews, Cart, Orders, Wishlist, Notifications, Activity, Bookmarks, Upload, Admin) plus Health — 55 operations total, each with:
- HTTP method + path
- Required auth (`bearerAuth` for the JWT access token, `csrfToken` for the double-submit header used on `/auth/refresh` and `/auth/logout`)
- A one-line summary
- Path parameters where applicable
- Example request bodies for the auth flows (register/login/forgot-password/reset-password)
- Common response codes with shared schemas for success/error/paginated shapes

Request/response bodies are deliberately kept light (generic `SuccessResponse` / `ErrorResponse` / `PaginatedResponse` schemas under `components.schemas`) rather than a full per-field schema for every Mongoose model — this keeps the spec maintainable as models evolve, while still documenting the contract that actually matters to a consumer: method, path, auth, and status codes.

## Extending it

To document a new or changed endpoint:

1. Open `backend/docs/openapi.json`.
2. Add/update the path under `paths`, following the existing pattern (`tags`, `summary`, `security`, `parameters`/`requestBody`, `responses`).
3. Reuse `components.schemas` / `components.responses` where the shape matches (`SuccessResponse`, `ErrorResponse`, `PaginatedResponse`, `Unauthorized`, `Forbidden`, `NotFound`, `ValidationError`) instead of inlining a new one.
4. Restart the dev server (or just refresh `/api-docs` — nothing needs rebuilding since the spec is loaded fresh from disk on each server start).

No code generation step, no JSDoc annotations to keep in sync — the spec is a single hand-maintained JSON file, which is easy to review in a PR diff.
