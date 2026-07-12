# Phase 11 — CSRF/Cookie Fix + Documentation

## The bug

Every `POST /api/auth/logout` and `POST /api/auth/refresh` test was failing with `403 Invalid or missing CSRF token`, even when the test correctly primed the CSRF cookie first via `primeCsrf()`.

**Root cause:** `issueCsrfCookie` (and the refresh-token cookie in `auth.controller.ts`) set an explicit `domain: env.COOKIE_DOMAIN` on the cookie, and `COOKIE_DOMAIN` defaulted to the literal string `'localhost'`. Supertest's `request.agent(app)` binds an ephemeral server and sends requests to the IP literal `127.0.0.1`, not the hostname `localhost`. A cookie with `Domain=localhost` is never sent back on a request to `127.0.0.1` — per the cookie spec, they're different hosts, with no implicit relationship. So the CSRF cookie (and the refresh cookie — same bug, same code shape) never round-tripped, and the double-submit check correctly, if inconveniently, failed every time.

## The fix

- `config/env.ts`: `COOKIE_DOMAIN` now defaults to `''` instead of `'localhost'`.
- `middlewares/csrf.middleware.ts` and `controllers/auth.controller.ts`: the `domain` option is now only included in `res.cookie(...)` / `res.clearCookie(...)` when `COOKIE_DOMAIN` is actually set — otherwise it's omitted entirely.

Omitting `Domain` makes a cookie **host-only**: it's scoped to whichever host actually issued it, so it matches on `localhost`, `127.0.0.1`, a LAN IP, or a Supertest agent, without needing to know in advance which one a given request will use. `Domain` is only meaningful in production, for sharing a cookie across subdomains — that's the one case where `COOKIE_DOMAIN` should actually be set.

Also updated: `tests/jest.env.ts` (stopped forcing `COOKIE_DOMAIN=localhost`) and `backend/.env.example` (documented default now empty, with an explanation of when to actually set it).

Verified with an isolated repro (identical cookie-option shape to the real code) confirming `domain: 'localhost'` 403s under a Supertest agent and the host-only fix returns 200. Running the full suite in-container also hit an unrelated environment limitation — `mongodb-memory-server` needs to download a MongoDB binary, and this sandbox's network allowlist doesn't permit that host — so the isolated repro is what's actually verified here; the underlying mechanism (cookie `Domain` scoping vs `127.0.0.1`) is standard, well-documented browser/HTTP-client behavior, not project-specific behavior that could differ.

## Documentation added

- Root `README.md` — project overview, quick start, doc index.
- `docs/API_DOCUMENTATION.md` — every endpoint by resource, with auth requirements.
- `docs/SWAGGER_DOCUMENTATION.md` + `backend/docs/openapi.json` — a real OpenAPI 3.0 spec (55 operations, all 13 resource groups) served live via `swagger-ui-express` at `/api-docs`, JSON at `/api-docs.json`. New dependency: `swagger-ui-express` (+ `@types/swagger-ui-express`).
- `docs/PROJECT_DOCUMENTATION.md` — architecture, request pipeline, data model, frontend state management.
- `docs/FOLDER_STRUCTURE.md` — folder-by-folder breakdown and a "where do I make this change" table.
- `docs/ENVIRONMENT_VARIABLES.md` — every env var for both packages, with a dedicated explanation of the `COOKIE_DOMAIN` gotcha above.
- `docs/INSTALLATION.md` — local dev setup only (deployment intentionally out of scope for this phase).
- `docs/GIT_COMMANDS.md` — everyday git workflow for this repo.
- `docs/COMMIT_MESSAGES.md` — commit convention, based on this repo's actual history.

## Verification

- `cd backend && npx tsc --noEmit` — passes, no type errors (including the new Swagger wiring).
- `cd backend && npx tsc -p tsconfig.json && npx tsc-alias -p tsconfig.json` — production build succeeds; `dist/app.js`'s `require('../docs/openapi.json')` resolves correctly against the built output.
- Isolated Supertest repro confirms the CSRF fix (see above).
- `/api-docs.json` and `/api-docs` verified to return 200 against the compiled app (55 paths, valid Swagger UI HTML) without needing a live database connection.

---

# Phase 8 — Advanced Features

This phase adds image upload, notifications, wishlist (pre-existing, verified), bookmarks,
recent activity, an upgraded profile page, an admin dashboard with real statistics and charts,
CSV data export, and email notifications for order events.

Images are stored **locally on disk** (`backend/uploads/`) rather than Cloudinary, per project
decision — the `cloudinary` package remains an installed-but-unused dependency in case you want
to switch later.

---

## 1. Image Upload (local disk storage)

- **Storage:** `multer` diskStorage, saving to `backend/uploads/` (created automatically, gitignored
  contents except `.gitkeep`). Files are renamed to `<timestamp>-<random>.<ext>` to avoid collisions.
- **Validation:** JPEG/PNG/WEBP/GIF only, 5MB max per file, up to 10 files per request.
- **Serving:** `app.ts` serves `/uploads/*` statically with a relaxed `Cross-Origin-Resource-Policy`
  header so the Vite dev origin can load the images.
- **Endpoints:**
  - `POST /api/upload/image` (auth required) — single image, field name `image`. Used for avatars.
  - `POST /api/upload/images` (admin/vendor only) — up to 10 images, field name `images`. Used for
    product galleries.
  - `DELETE /api/upload/:filename` (admin/vendor only) — deletes a file from disk.
- **Frontend:** `services/uploadService.ts`, `components/common/ImageUploader.tsx` (drag-and-drop,
  previews, remove button — wired into `AdminProductFormPage`), and a hover-to-upload avatar control
  in `ProfilePage`.

To switch to Cloudinary later: replace the multer disk storage in
`backend/src/middlewares/upload.middleware.ts` with `multer-storage-cloudinary`, and set
`CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` in `.env` (placeholders
already exist there).

## 2. Notifications

- **Model:** `backend/src/models/Notification.ts` — `type`, `title`, `message`, `link`, `isRead`.
- **Triggers:** order placed, order status changed (see `order.controller.ts`).
- **Endpoints (`/api/notifications`):** list (paginated, includes `unreadCount`), `PATCH /:id/read`,
  `PATCH /read-all`, `DELETE /:id`.
- **Frontend:** `NotificationBell` in the navbar — unread badge, dropdown list, mark-as-read on click,
  mark-all-as-read, delete. Polls every 60s.

## 3. Wishlist

Already existed and works correctly server-side (`Wishlist` model/controller/routes). Verified and
left as-is; `added_to_wishlist` / `removed_from_wishlist` now also write to the activity feed.

## 4. Bookmarks

A lighter-weight, distinct-from-wishlist "save for later" list — one bookmark per product per user,
with an optional note field for future use.

- **Model:** `backend/src/models/Bookmark.ts`.
- **Endpoints (`/api/bookmarks`):** `GET /`, `POST /:productId`, `DELETE /:productId`.
- **Frontend:** `BookmarkButton` (on every product card, below the wishlist heart) and a "Bookmarked
  products" section on the Profile page.

## 5. Recent Activity

- **Model:** `backend/src/models/Activity.ts` — rolling feed, auto-expires after 90 days (MongoDB TTL
  index) so it never grows unbounded.
- **Logged from:** login, profile update, added to cart, placed order, order status change, wrote a
  review, added/removed wishlist, bookmarked a product.
- **Endpoints (`/api/activity`):** `GET /` (paginated), `DELETE /` (clear history).
- **Frontend:** "Recent activity" section on the Profile page with relative timestamps and a clear
  button.

## 6. Profile

`ProfilePage` gained:
- Clickable avatar with hover-to-upload (uses the new image upload endpoint).
- "Bookmarked products" section.
- "Recent activity" section.

(Saved addresses and name/phone editing already existed and are untouched.)

## 7. Dashboard, Statistics & Charts

- **Endpoint:** `GET /api/admin/stats` (admin only) returns:
  - `totals`: revenue, orders, products, customers, recent signups (last 30 days)
  - `ordersByStatus`: counts per status
  - `revenueByDay`: last 30 days, `{ date, revenue, orders }`
  - `topProducts`: top 5 by units sold
- **Frontend:** `AdminDashboardPage` rewritten with real numbers (previously showed placeholder `—`
  for products/customers). New `components/admin/DashboardCharts.tsx` (recharts): a revenue line
  chart, an order-status pie chart, and an order-volume bar chart, plus a top-products table.

## 8. Export Data

CSV export, admin-only, streamed as a file download:

- `GET /api/admin/export/orders?status=` 
- `GET /api/admin/export/products?category=`
- `GET /api/admin/export/users?role=`

Frontend: three "Export CSV" buttons on the dashboard (`adminService.ts` triggers a real browser
download via a Blob response).

## 9. Email Notifications

Extends the existing `email.service.ts` (which already handled verification/reset emails and
gracefully logs instead of sending when SMTP isn't configured):

- `sendOrderConfirmationEmail` — sent when an order is placed.
- `sendOrderStatusUpdateEmail` — sent whenever an admin changes an order's status.

Both are fire-and-forget (failures are logged, never block the API response).

---

## New backend files

```
src/models/Notification.ts
src/models/Activity.ts
src/models/Bookmark.ts
src/services/notification.service.ts
src/services/activity.service.ts
src/middlewares/upload.middleware.ts
src/controllers/upload.controller.ts
src/controllers/notification.controller.ts
src/controllers/activity.controller.ts
src/controllers/bookmark.controller.ts
src/controllers/admin.controller.ts
src/routes/upload.routes.ts
src/routes/notification.routes.ts
src/routes/activity.routes.ts
src/routes/bookmark.routes.ts
src/routes/admin.routes.ts
src/utils/csv.ts
uploads/                      (local image storage, gitignored)
```

Modified: `app.ts` (static `/uploads`), `routes/index.ts` (mount new routes), `models/index.ts`,
`services/email.service.ts`, `controllers/order.controller.ts`, `controllers/cart.controller.ts`,
`controllers/review.controller.ts`.

## New frontend files

```
src/types/notification.types.ts
src/types/activity.types.ts
src/types/bookmark.types.ts
src/types/admin.types.ts
src/services/notificationService.ts
src/services/activityService.ts
src/services/bookmarkService.ts
src/services/uploadService.ts
src/services/adminService.ts
src/hooks/useNotifications.ts
src/hooks/useActivity.ts
src/hooks/useBookmarks.ts
src/hooks/useAdminStats.ts
src/components/common/NotificationBell.tsx
src/components/common/BookmarkButton.tsx
src/components/common/ImageUploader.tsx
src/components/admin/DashboardCharts.tsx
```

Modified: `Navbar.tsx` (bell), `ProductCard.tsx` (bookmark button), `AdminProductFormPage.tsx`
(image uploader), `AdminDashboardPage.tsx` (real stats/charts/export), `ProfilePage.tsx` (avatar
upload, bookmarks, activity), `productService.ts` (fixed the create/update payload shape — it was
sending `categoryId`/raw image URL strings/no `slug`, none of which match what the API expects).

Added dependency: `recharts` (charts on the admin dashboard).

## Also fixed along the way

- **The original bug** (`categories?.map is not a function`): `categoryService.list()` was treating
  the backend's paginated `{ items, meta }` response as a bare array. Fixed to unwrap `.items`.
- Two Express-5 typing issues (`req.params` can type as `string | string[]`) in `user.controller.ts`
  and `wishlist.controller.ts` that broke `tsc -b`.
- A stray backend-only file (`frontend/src/config/db.ts`, importing `mongoose`) that had leaked into
  the frontend and broke its typecheck — removed.
- A case-sensitivity import bug (`PriceRangeFilter` vs `priceRangeFilter.tsx`) that broke the
  frontend build on this (case-sensitive) filesystem — renamed the file to match.

## Verification

- `cd backend && npm run build` — passes (`tsc` + `tsc-alias`), no type errors.
- `cd frontend && npx tsc -b` — passes, no type errors.
- `cd frontend && npx vite build` — passes, production bundle builds successfully.

## Environment notes

No new required env vars. `backend/uploads/` is created automatically on first run. If you deploy
somewhere the filesystem is ephemeral (e.g. most serverless hosts), local disk storage will not
persist across deploys — swap in Cloudinary (keys already have placeholders in `.env.example`) for
production.