# Folder Structure

This is a two-package repo: `backend/` (Express + TypeScript + MongoDB) and `frontend/` (React + TypeScript + Vite). They are not a workspace/monorepo — each has its own `package.json`, `node_modules`, and is run independently.

```
mern-ecommerce/
├── backend/
├── frontend/
├── docs/                  ← you are here
└── .github/workflows/     ← CI config
```

## `backend/`

```
backend/
├── docs/
│   └── openapi.json          # OpenAPI 3.0 spec, served at /api-docs
├── src/
│   ├── app.ts                 # Express app: middleware stack, route mounting (no listen())
│   ├── server.ts               # Entry point: connects DB, then app.listen()
│   ├── config/
│   │   ├── env.ts              # Loads & validates process.env into a typed `env` object
│   │   └── db.ts               # Mongoose connection helpers
│   ├── constants/
│   │   └── roles.ts            # ROLES enum-like object (customer/admin/vendor)
│   ├── models/                 # Mongoose schemas — one file per collection
│   ├── controllers/             # Route handler logic, one file per resource
│   ├── routes/                  # Express routers; index.ts mounts them all under /api
│   ├── middlewares/              # auth, CSRF, caching, sanitization, error handling, logging
│   ├── validators/               # express-validator chains, one file per resource
│   ├── services/                  # Cross-cutting logic: JWT signing, email, activity feed, notifications
│   ├── utils/                      # AppError, asyncHandler, logger, CSV writer, query helpers
│   ├── types/                       # Ambient type augmentation (e.g. req.user, req.requestId) + shared API types
│   ├── scripts/                      # One-off scripts (e.g. seedProducts.ts), not part of the running app
│   └── uploads/                       # Local disk storage for uploaded images (gitignored contents)
└── tests/
    ├── jest.env.ts             # Env vars injected before any test module loads
    ├── helpers/                 # Test DB (mongodb-memory-server) + factories (createUser, authHeader)
    └── integration/              # Supertest suites, one file per resource
```

**Path aliases** (`@config/*`, `@controllers/*`, `@models/*`, `@routes/*`, `@middlewares/*`, `@services/*`, `@utils/*`, `@validators/*`, `@types/*`, `@constants/*`) are defined in `tsconfig.json` and resolved at build time by `tsc-alias`, and at test time by Jest's `moduleNameMapper`.

## `frontend/`

```
frontend/
├── src/
│   ├── main.tsx / App.tsx      # Entry point and root component
│   ├── pages/                   # Route-level components (one per page/screen)
│   ├── components/                # Reusable UI pieces, grouped by area (common/, admin/, ...)
│   ├── features/                    # Feature-scoped logic (e.g. cart, auth) co-located with its state
│   ├── contexts/                     # React Context providers
│   ├── store/                         # Global state (see the store's own README/index for the library used)
│   ├── hooks/                          # Custom hooks (useNotifications, useActivity, useBookmarks, ...)
│   ├── services/                        # API client functions, one file per backend resource
│   ├── routes/                           # Route table / router configuration
│   ├── types/                             # Shared TS types/interfaces, mirroring backend response shapes
│   ├── validations/                        # Client-side form validation schemas
│   ├── utils/ / lib/                        # Formatting helpers, class-name helper (`cn`), storage wrapper
│   ├── constants/                            # App-wide constants
│   └── __tests__/                             # Integration tests (Vitest/RTL)
└── public/                                      # Static assets served as-is
```

## Where to make a change

| I want to... | Look in... |
|---|---|
| Add/modify an API endpoint | `backend/src/routes/`, `.../controllers/`, `.../validators/` |
| Change what a cookie/token contains or how long it lasts | `backend/src/services/token.service.ts`, `.../controllers/auth.controller.ts` |
| Add a DB field | `backend/src/models/<Model>.ts` |
| Change API docs | `backend/docs/openapi.json` (served live at `/api-docs`) |
| Add a page | `frontend/src/pages/`, wire it in `frontend/src/routes/` |
| Call a new backend endpoint from the UI | `frontend/src/services/`, then a hook in `frontend/src/hooks/` if it needs shared state |
| Change env-driven behavior | `backend/.env.example` / `frontend/.env.example`, then `backend/src/config/env.ts` |
