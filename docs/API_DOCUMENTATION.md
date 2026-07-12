# API Documentation

**Interactive docs:** run the backend (`npm run dev` in `backend/`) and open **http://localhost:5000/api-docs** — a full Swagger UI where you can browse every endpoint and try requests directly against your local server. The raw spec is also available as JSON at `/api-docs.json` (useful for importing into Postman/Insomnia or generating a client).

This document is a readable companion to that spec — see [`backend/docs/openapi.json`](../backend/docs/openapi.json) for the source of truth.

All endpoints are mounted under `/api` (e.g. `/api/auth/login`), except `/health`, which is mounted at the server root.

## Response shape

Success:
```json
{ "success": true, "message": "...", "data": { } }
```
List endpoints wrap results as:
```json
{ "success": true, "data": { "items": [ ], "meta": { "page": 1, "limit": 20, "total": 0, "totalPages": 0 } } }
```
Errors:
```json
{ "success": false, "message": "..." }
```

## Authentication

- Register/login return a short-lived **access token** (JWT). Send it on every authenticated request:
  `Authorization: Bearer <accessToken>`
- A long-lived **refresh token** is set as an httpOnly cookie automatically — you never handle it directly.
- `POST /api/auth/refresh` and `POST /api/auth/logout` are the only routes authenticated purely via that cookie (every other route requires the Bearer header, which a forged cross-site request can't attach). Because of that, both routes also require a `X-CSRF-Token` header matching the readable `XSRF-TOKEN` cookie the server sets automatically on every response (double-submit CSRF check). Read the cookie, echo it back as the header — the frontend's API client already does this for you.

## Endpoints by resource

### Auth (`/api/auth`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/register` | — | Rate-limited |
| POST | `/login` | — | Rate-limited; sets cookies |
| POST | `/logout` | Refresh cookie + CSRF header | |
| POST | `/refresh` | Refresh cookie + CSRF header | |
| GET | `/me` | Bearer | |
| POST | `/forgot-password` | — | Rate-limited; always 200 (no email enumeration) |
| POST | `/reset-password` | — | Rate-limited |
| GET / POST | `/verify-email` | — | Token via query string (GET) or body (POST) |
| POST | `/resend-verification` | — | Rate-limited |

### Users (`/api/users`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET / PATCH | `/me` | Bearer | |
| POST | `/me/addresses` | Bearer | |
| PATCH / DELETE | `/me/addresses/:addressId` | Bearer | |
| GET | `/` | Bearer, admin | List all users |
| GET / DELETE | `/:id` | Bearer, admin | |
| PATCH | `/:id/role` | Bearer, admin | |

### Products (`/api/products`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/` | — | Cached 30s; filterable/paginated |
| GET | `/slug/:slug` | — | Cached 60s |
| GET | `/:id` | — | Cached 60s |
| POST | `/` | Bearer, admin/vendor | |
| PATCH / DELETE | `/:id` | Bearer, admin/vendor | |
| POST | `/bulk-delete` | Bearer, admin/vendor | |
| PATCH | `/bulk-stock` | Bearer, admin/vendor | |

### Categories (`/api/categories`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/` | — | Cached 120s |
| GET | `/:id` | — | Cached 120s |
| POST | `/` | Bearer, admin | |
| PATCH / DELETE | `/:id` | Bearer, admin | |
| POST | `/bulk-delete` | Bearer, admin | |

### Reviews (`/api/reviews`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/product/:productId` | — | |
| POST | `/` | Bearer | |
| PATCH / DELETE | `/:id` | Bearer | Own review only |
| POST | `/bulk-delete` | Bearer, admin | |

### Cart (`/api/cart`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET / DELETE | `/` | Bearer | |
| POST | `/items` | Bearer | |
| PATCH / DELETE | `/items/:productId` | Bearer | |
| POST | `/merge` | Bearer | Merges a guest cart into the account cart on login |

### Orders (`/api/orders`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/admin` | Bearer, admin | |
| PATCH | `/bulk-status` | Bearer, admin | |
| GET / POST | `/` | Bearer | List mine / place an order |
| GET | `/:id` | Bearer | |
| PATCH | `/:id/status` | Bearer, admin | |
| PATCH | `/:id/cancel` | Bearer | |
| DELETE | `/:id` | Bearer, admin | |

### Wishlist (`/api/wishlist`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET / DELETE | `/` | Bearer | |
| POST | `/bulk-add` | Bearer | |
| POST / DELETE | `/:productId` | Bearer | |

### Notifications (`/api/notifications`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/` | Bearer | Paginated, includes `unreadCount` |
| PATCH | `/read-all` | Bearer | |
| PATCH | `/:id/read` | Bearer | |
| DELETE | `/:id` | Bearer | |

### Activity (`/api/activity`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET / DELETE | `/` | Bearer | Paginated feed / clear history |

### Bookmarks (`/api/bookmarks`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/` | Bearer | |
| POST / DELETE | `/:productId` | Bearer | |

### Upload (`/api/upload`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/image` | Bearer | Single image, field `image`; rate-limited |
| POST | `/images` | Bearer, admin/vendor | Up to 10 images, field `images`; rate-limited |
| DELETE | `/:filename` | Bearer, admin/vendor | |

### Admin (`/api/admin`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/stats` | Bearer, admin | Totals, orders by status, revenue by day, top products |
| GET | `/export/orders` \| `/export/products` \| `/export/users` | Bearer, admin | Streamed CSV download |

### Health
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/health` | — | `200` if DB connected, `503` if degraded |

## Roles

`customer` (default), `vendor`, `admin` — see `backend/src/constants/roles.ts`. Routes above marked "admin" or "admin/vendor" use the `authorize(...)` middleware to restrict by role.
