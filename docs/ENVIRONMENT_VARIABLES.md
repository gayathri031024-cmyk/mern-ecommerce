# Environment Variables Guide

Copy each `.env.example` to `.env` in the same folder and fill in real values. `.env` is gitignored; `.env.example` is committed as a template.

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

## `backend/.env`

| Variable | Required | Default | Notes |
|---|---|---|---|
| `NODE_ENV` | no | `development` | `development` \| `test` \| `production`. `test` is set automatically by `tests/jest.env.ts`, don't set it by hand for local dev. |
| `PORT` | no | `5000` | Port the API listens on. |
| `API_BASE_URL` | no | `http://localhost:5000` | Used in logging and any absolute links the backend generates. |
| `CLIENT_URL` | no | `http://localhost:5173` | Sets the `Access-Control-Allow-Origin` value for CORS. Must exactly match the origin the frontend is served from, including scheme and port. |
| `MONGO_URI` | **yes** | — | MongoDB connection string. App exits at startup if missing. |
| `JWT_ACCESS_SECRET` | **yes** | — | Signs short-lived access tokens. App exits at startup if missing. |
| `JWT_ACCESS_EXPIRES_IN` | no | `15m` | Any [ms](https://github.com/vercel/ms)-compatible duration string. |
| `JWT_REFRESH_SECRET` | **yes** | — | Signs the long-lived refresh token stored in the httpOnly cookie. App exits at startup if missing. Use a **different** value from `JWT_ACCESS_SECRET`. |
| `JWT_REFRESH_EXPIRES_IN` | no | `7d` | Any ms-compatible duration string. |
| `COOKIE_DOMAIN` | no | *(empty)* | **Leave empty for local dev/test.** See [callout below](#cookie_domain-what-it-actually-does). |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | no | — | Not required — image uploads use local disk storage (`backend/uploads/`) by default. Placeholders only, for anyone who wants to switch to Cloudinary. |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` | no | `smtp.gmail.com` / `587` / — / — | If `SMTP_USER`/`SMTP_PASSWORD` are blank, the email service logs the email instead of sending it — verification/reset flows still work locally, you just read the token from the console/log instead of an inbox. |
| `EMAIL_FROM` | no | `noreply@ecommerce.com` | From-address on outgoing emails. |
| `RATE_LIMIT_WINDOW_MS` | no | `900000` (15 min) | Window for the sensitive-endpoint rate limiter (register/login/password reset). |
| `RATE_LIMIT_MAX_REQUESTS` | no | `100` | Max requests per window per IP for those endpoints. |

### `COOKIE_DOMAIN`: what it actually does

`COOKIE_DOMAIN` sets the `Domain` attribute on the CSRF (`XSRF-TOKEN`) and refresh-token cookies. This attribute is **only useful for sharing a cookie across subdomains** in production (e.g. `api.example.com` issuing a cookie that `www.example.com` can also read, via `COOKIE_DOMAIN=.example.com`).

Leave it empty everywhere else. When empty, the app omits the `Domain` attribute entirely, and the cookie becomes **host-only** — scoped to whichever host actually issued it. That's what makes it work correctly whether you hit the API via `localhost`, `127.0.0.1`, a LAN IP, or (in CI) a Supertest agent bound to an ephemeral server.

Setting it to a literal hostname like `localhost` will silently break CSRF and refresh-token round-tripping for anyone (or any test) hitting the API via a different-but-equivalent host, such as `127.0.0.1` — a cookie with `Domain=localhost` is never sent on a request to `127.0.0.1`, since the cookie spec treats them as different hosts. This was the root cause of a bug in this project's test suite (see `backend/README.md`, Phase 11) — every CSRF/refresh test failed with 403 until the default was changed.

## `frontend/.env`

| Variable | Required | Default | Notes |
|---|---|---|---|
| `VITE_API_BASE_URL` | no | `http://localhost:5000/api` | Base URL the frontend's API client sends requests to. Must match where the backend is actually running. |
| `VITE_APP_NAME` | no | `E-Shop` | Display name used in the UI (title, header, etc.). |
| `VITE_CLOUDINARY_CLOUD_NAME` / `VITE_CLOUDINARY_UPLOAD_PRESET` | no | — | Only needed if you switch the frontend's upload widget to Cloudinary's unsigned upload flow; unused with the default local-disk upload setup. |

Vite only exposes variables prefixed `VITE_` to client code — anything else in `frontend/.env` is invisible to the app by design.