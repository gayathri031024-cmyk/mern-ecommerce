# Shopfront — MERN E-Commerce Platform

A full-stack e-commerce application built with MongoDB, Express, React, and Node — written in TypeScript end to end. It covers product catalog and search, cart and checkout, order management, reviews, wishlists, an admin dashboard, and transactional email flows (verification, password reset, order updates).

```
┌─────────────┐        HTTPS/JSON         ┌──────────────┐        Mongoose         ┌─────────┐
│   React SPA │  ───────────────────────▶ │  Express API │ ───────────────────────▶│ MongoDB │
│  (frontend) │ ◀─────────────────────── │  (backend)   │ ◀─────────────────────── │         │
└─────────────┘   Bearer token + cookies   └──────────────┘                          └─────────┘
```

## Features

- **Catalog** — products, categories, search, filtering, ratings and reviews
- **Cart & checkout** — persistent cart, shipping address, multiple payment method selection
- **Orders** — order history, order detail, admin order management with status updates
- **Auth** — register/login, email verification, forgot/reset password, short-lived access tokens + httpOnly refresh cookie
- **Wishlist & bookmarks**
- **Admin dashboard** — manage products, categories, orders, and users
- **Notifications** — in-app activity/notification feed
- **Email** — verification, password reset, and order-update emails (falls back to console logging in local dev if SMTP isn't configured)

## Tech stack

| | |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, React Router, TanStack Query, Zustand, React Hook Form + Zod, Tailwind CSS |
| **Backend** | Node.js, Express, TypeScript, MongoDB + Mongoose |
| **Auth** | JWT access tokens (Bearer) + httpOnly refresh-token cookie, CSRF double-submit cookie |
| **Testing** | Vitest + React Testing Library (frontend), Jest + Supertest + `mongodb-memory-server` (backend) |
| **CI** | GitHub Actions — lint, typecheck, and test both packages on every push/PR |

## Project structure

This is a two-package repo — `backend/` and `frontend/` each have their own `package.json` and are run independently (not a monorepo/workspace).

```
mern-ecommerce/
├── backend/     Express + TypeScript API
├── frontend/    React + TypeScript + Vite SPA
├── docs/        Architecture, API, environment variable, and setup documentation
└── .github/workflows/   CI configuration
```

See [`docs/FOLDER_STRUCTURE.md`](docs/FOLDER_STRUCTURE.md) for the full breakdown of each package, and [`docs/PROJECT_DOCUMENTATION.md`](docs/PROJECT_DOCUMENTATION.md) for a deeper look at the architecture, request pipeline, and data model.

## Getting started

### Prerequisites

- **Node.js** ≥ 20 and npm
- **MongoDB** — a local `mongod` instance, or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- **Git**

### 1. Clone the repo

```bash
git clone https://github.com/gayathri031024-cmyk/mern-ecommerce.git
cd mern-ecommerce
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and set at minimum `MONGO_URI`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET` (two different long random strings). Everything else has a sensible default for local dev — see [`docs/ENVIRONMENT_VARIABLES.md`](docs/ENVIRONMENT_VARIABLES.md) for details, and in particular **leave `COOKIE_DOMAIN` empty** unless you have a specific reason to set it.

```bash
npm run dev
```

You should see `🚀 Server running in development mode on http://localhost:5000`. Interactive API docs are served at **http://localhost:5000/api-docs**.

Optionally, seed sample products:

```bash
npm run seed
```

### 3. Frontend

In a second terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The default `VITE_API_BASE_URL=http://localhost:5000/api` already points at the backend above. Vite will print a local URL — normally **http://localhost:5173**.

> **Heads up:** the backend's CORS policy only allows requests from the exact origin in `CLIENT_URL` (`http://localhost:5173` by default). If port `5173` is already in use, Vite will silently start on `5174` (or another port) instead, and API calls will fail with a CORS error until either the origin matches or the conflicting process is stopped. If you hit this, run `netstat -ano | findstr :5173` (Windows) to find and stop whatever's already using the port, then restart the frontend.

### 4. Verify it's wired up

- Backend health check: `curl http://localhost:5000/health` → `{"status":"ok", ...}`
- Open the frontend, register a test account, and log in — this exercises the API, database, and cookie/CSRF flow end to end.

Full step-by-step setup, plus a troubleshooting table for common issues, is in [`docs/INSTALLATION.md`](docs/INSTALLATION.md).

## Available scripts

**Backend** (`backend/`)

| Script | Purpose |
|---|---|
| `npm run dev` | Start the API with hot reload |
| `npm run seed` | Seed sample products and categories |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled build |
| `npm test` | Run the Jest test suite |
| `npm run test:coverage` | Run tests with coverage |
| `npm run lint` / `lint:fix` | Lint (and auto-fix) |
| `npm run typecheck` | Type-check without emitting |

**Frontend** (`frontend/`)

| Script | Purpose |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run the Vitest suite |
| `npm run test:coverage` | Run tests with coverage |
| `npm run lint` / `lint:fix` | Lint (and auto-fix) |
| `npm run typecheck` | Type-check without emitting |

## Testing

```bash
# Backend — spins up an in-memory MongoDB, no real DB connection needed
cd backend
npm test

# Frontend
cd frontend
npm test
```

CI (`.github/workflows/test.yml`) runs lint, typecheck, and tests for both packages on every push and pull request to `main`.

## Documentation

Deeper docs live in [`docs/`](docs):

- [`PROJECT_DOCUMENTATION.md`](docs/PROJECT_DOCUMENTATION.md) — architecture, request pipeline, data model
- [`API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md) — REST API reference (also served live via Swagger at `/api-docs`)
- [`INSTALLATION.md`](docs/INSTALLATION.md) — detailed local setup and troubleshooting
- [`ENVIRONMENT_VARIABLES.md`](docs/ENVIRONMENT_VARIABLES.md) — every env var, what it does, and its default
- [`FOLDER_STRUCTURE.md`](docs/FOLDER_STRUCTURE.md) — where to find and add things
- [`SWAGGER_DOCUMENTATION.md`](docs/SWAGGER_DOCUMENTATION.md) — using the interactive API docs

## License

No license file has been added yet — all rights reserved by default until one is chosen.
