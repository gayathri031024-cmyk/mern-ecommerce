# Installation Guide (Local Development)

This covers getting the project running on your machine. It does not cover deploying it anywhere.

## Prerequisites

- **Node.js** >= 20.0.0 and npm (check with `node -v`)
- **MongoDB** — either:
  - a local `mongod` instance, or
  - a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (a connection string is enough; nothing else to install)
- **Git**

## 1. Clone the repo

```bash
git clone <repo-url>
cd mern-ecommerce
```

## 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and fill in at minimum:
- `MONGO_URI` — your connection string
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` — any two long random strings, and make sure they're different from each other

Everything else has a working default for local dev. See [`ENVIRONMENT_VARIABLES.md`](./ENVIRONMENT_VARIABLES.md) for what each one does — in particular, **leave `COOKIE_DOMAIN` empty** unless you have a specific reason to set it.

Start the API:

```bash
npm run dev
```

This runs `ts-node-dev` with hot reload. You should see a log line like `🚀 Server running in development mode on http://localhost:5000`.

Optional — seed some sample products:

```bash
npm run seed
```

Browse the interactive API docs once the server is running: **http://localhost:5000/api-docs**

## 3. Frontend setup

In a second terminal:

```bash
cd frontend
npm install
cp .env.example .env
```

The default `VITE_API_BASE_URL=http://localhost:5000/api` already points at the backend from step 2 — change it only if you changed the backend's `PORT`.

Start the dev server:

```bash
npm run dev
```

Vite will print a local URL (typically `http://localhost:5173`). Open it in a browser.

## 4. Verify everything is wired up

- Backend health check: `curl http://localhost:5000/health` → `{"status":"ok", ...}` once MongoDB is connected.
- Frontend loads and can register/log in a test account — this exercises the API, DB, and the CSRF/cookie flow end to end.

## 5. Running tests

```bash
cd backend
npm test
```

Integration tests spin up an in-memory MongoDB via `mongodb-memory-server` — no real database connection needed to run them. The first run downloads a MongoDB binary; subsequent runs reuse the cached copy.

```bash
cd frontend
npm run typecheck   # or: npx vitest, if a test script is configured
```

## Common local setup issues

| Symptom | Likely cause |
|---|---|
| App exits immediately with "Missing required environment variables" | `MONGO_URI`, `JWT_ACCESS_SECRET`, or `JWT_REFRESH_SECRET` not set in `backend/.env` |
| Frontend requests fail with a CORS error | `CLIENT_URL` in `backend/.env` doesn't match the origin Vite is actually serving from |
| Login works but every subsequent authenticated action 401s | Access token not being attached — check the frontend's API client is sending the `Authorization: Bearer <token>` header |
| `/api/auth/refresh` or `/api/auth/logout` returns 403 "Invalid or missing CSRF token" | Usually a cookie-domain mismatch — see the `COOKIE_DOMAIN` section in [`ENVIRONMENT_VARIABLES.md`](./ENVIRONMENT_VARIABLES.md) |
| Password reset / verification email never arrives | Expected if `SMTP_USER`/`SMTP_PASSWORD` aren't set — the token is logged to the backend console instead |
