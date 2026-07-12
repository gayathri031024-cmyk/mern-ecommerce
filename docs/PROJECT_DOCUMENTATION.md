# Project Documentation

## What this is

A full-stack e-commerce application: product catalog, cart, checkout/orders, reviews, wishlist, bookmarks, notifications, an admin dashboard, and email flows (verification, password reset, order updates).

**Stack:** MongoDB + Express + React + Node — the "MERN" stack — written in TypeScript on both ends, with Vite for the frontend build.

## Architecture at a glance

```
┌─────────────┐        HTTPS/JSON         ┌──────────────┐        Mongoose         ┌─────────┐
│   React SPA │  ───────────────────────▶ │  Express API │ ───────────────────────▶│ MongoDB │
│  (frontend) │ ◀─────────────────────── │  (backend)   │ ◀─────────────────────── │         │
└─────────────┘   Bearer token + cookies   └──────────────┘                          └─────────┘
```

- The frontend is a single-page app (React Router) that talks to the backend exclusively over its `/api/*` REST endpoints.
- The backend is stateless application logic — no server-side sessions or rendered views. All persistent state is in MongoDB.
- Authentication mixes both approaches deliberately: a **Bearer access token** (short-lived, sent explicitly on every request, immune to CSRF since a cross-site page can't read it or auto-attach it) plus an **httpOnly refresh-token cookie** (long-lived, can't be read by JS, but *is* auto-attached by the browser — which is exactly why the two cookie-only routes need the CSRF double-submit check described in [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md)).

## Backend request pipeline (`backend/src/app.ts`)

In order, every request passes through:

1. `helmet` — security headers (CSP, etc.)
2. `cors` — restricted to `CLIENT_URL`, with credentials enabled (required for the cookies above to work cross-origin in dev, where frontend and backend run on different ports)
3. `compression`
4. A general rate limiter (auth-sensitive routes layer a stricter one on top — see `auth.routes.ts`)
5. `express.json()` / `urlencoded()` — body parsing, capped at 10kb
6. `cookie-parser`
7. `express-mongo-sanitize` — strips Mongo operator injection (`$gt`, etc.) from input
8. A custom XSS-sanitizing middleware
9. `issueCsrfCookie` — ensures every client has a readable `XSRF-TOKEN` cookie
10. `requestLogger` — structured request logging with a per-request UUID (`req.requestId`)
11. Route mounting: `/api-docs` (Swagger UI), `/health`, `/api/*`
12. `notFoundHandler` → `errorHandler` — centralized 404 and error formatting

Individual routers add their own middleware on top where needed: `authenticate` (verifies the Bearer token), `authorize(...roles)` (role check), `validate*` (express-validator chains), `cacheGet(ttl)` / `bustCacheOnMutation` (in-process response caching for read-heavy catalog endpoints).

## Data model (MongoDB collections)

`User`, `Product`, `Category`, `Review`, `Cart`, `Order`, `Wishlist`, `Bookmark`, `Notification`, `Activity` — see `backend/src/models/`. Most support **soft delete** via a shared `softDelete.plugin.ts` Mongoose plugin rather than hard-deleting documents.

## Frontend architecture

- **Routing:** `react-router-dom`, route table in `frontend/src/routes/`.
- **Server state:** `@tanstack/react-query` — API calls go through `frontend/src/services/`, wrapped in hooks (`frontend/src/hooks/`) that use React Query for caching/invalidation.
- **Client/UI state:** `zustand` stores in `frontend/src/store/` (`authStore`, `cartStore`, `wishlistStore`, `uiStore`, ...); `wishlistStore` persists to storage via `zustand/middleware`'s `persist`.
- **Forms:** `react-hook-form` + `zod` resolvers.
- **Styling:** Tailwind CSS (see `tailwind.config.js`).

## Cross-cutting concerns worth knowing about

- **Caching:** `GET /api/products` and `/api/categories` are cached in-process for a short TTL (30s/120s respectively) and busted immediately on any mutation to that resource, so admin edits are never stale for more than a few seconds.
- **CSV export:** admin-only endpoints stream CSV directly to the response rather than buffering the whole file in memory (`backend/src/utils/csv.ts`).
- **Email:** `services/email.service.ts` sends via SMTP if configured, otherwise logs the email content — so verification/reset flows are fully testable without a real mailbox.
- **Uploads:** stored on local disk (`backend/uploads/`) and served statically; swappable for Cloudinary later (see `backend/README.md`, Phase 8, for the migration note).

## Known cookie-scoping gotcha (fixed — see `backend/README.md`, Phase 11)

Cookies for CSRF and refresh-token used to hardcode `Domain=localhost`. Because that attribute makes a cookie host-*specific*, it silently broke whenever a request came from an equivalent-but-different host string — most notably Supertest's ephemeral test server, which talks to `127.0.0.1`, not `localhost`. The fix (documented in [`ENVIRONMENT_VARIABLES.md`](./ENVIRONMENT_VARIABLES.md)) makes these cookies host-only by default, which is correct for both local dev and CI, and reserves the `Domain` attribute for its real use case: sharing a cookie across subdomains in production.
