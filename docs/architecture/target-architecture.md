# Target architecture

## Topology

```
Browser
  │
  │ HTTPS, same-origin
  ▼
Next.js (frontend/)
  ├─ React Server Components / Client Components
  ├─ Route Handlers (app/api/*)
  ├─ Server Actions (forms, mutations)
  ├─ Middleware (cookie verify, JWT)
  └─ frontend/src/server/      (server-only modules)
        │
        │ HTTPS, internal
        ▼
   Go API Gateway (services/api-gateway/)
        ├─ JWT verify (JWKS fetched from backend)
        ├─ CORS, rate limit, correlation IDs, logging
        ├─ header injection
        └─ reverse proxy
        │
        │ HTTP, internal VPC
        ▼
   .NET Backend (backend/)
        ├─ /api/Auth/login         (issues JWT, RS256)
        ├─ /.well-known/jwks.json  (public key set)
        ├─ domain + use cases
        ├─ EF Core → PostgreSQL
        └─ integrations: Santander, Azure Blob, Azure OpenAI, Resend
```

## Component responsibilities

### Next.js (`frontend/`)

- All UI rendering (RSC by default, client islands where needed).
- Route Handlers for browser-facing API: `/api/auth/*`, `/api/health`, public portal endpoints.
- Server Actions for writes.
- Server Components fetch data via the typed client at `frontend/src/server/clients/backend.ts`.
- Middleware (`frontend/src/middleware.ts`) verifies the session cookie on protected paths and injects `x-user-*` request headers for downstream RSC and Route Handlers.
- `frontend/src/server/` is a server-only barrier (`server-only` package). Client code must not import from it.
- No direct PostgreSQL access. No core business logic. Only view-shaped orchestration.

### Go API Gateway (`services/api-gateway/`)

- See ADR 0003. Thin. Validation, routing, observability. No business logic.
- Validates incoming JWTs against the backend's JWKS endpoint.
- Strips hop-by-hop headers.
- Injects `X-User-Id`, `X-User-Login`, `X-User-Groups` from JWT claims for backend audit.
- Public endpoints allowlisted (`/api/Auth/login`, `/api/portal-cliente/auth`, `/api/health`).
- Single ingress point for backend + future microservices.

### Backend (`backend/`, .NET)

- Domain entities and use cases.
- EF Core migrations against PostgreSQL.
- JWT issuance (`/api/Auth/login`) and JWKS endpoint (`/.well-known/jwks.json`).
- Authorization rules (RBAC, group permissions).
- Audit logging.
- External integrations (Santander, Azure Blob, Resend, Azure OpenAI + RAG).

### NestJS BFF (`bff/`)

- **Deprecated.** Kept running during the migration for rollback. Removed in Phase 4.

## Request flow (authenticated read)

1. Browser → Next.js (same origin): `GET /clientes`.
2. Next.js Server Component imports `frontend/src/server/clients/backend.ts`.
3. `backend.ts` calls `GET ${API_GATEWAY_URL}/api/Cliente` with `Authorization: Bearer ${cookieToken}`.
4. Gateway validates JWT, sets `X-User-*`, proxies to `${BACKEND_URL}/api/Cliente`.
5. Backend authorizes by group, queries Postgres via EF, returns JSON.
6. Gateway logs the request and adds a correlation ID header.
7. Next.js renders the RSC and streams HTML to the browser.

## Request flow (authenticated write — Server Action)

1. Browser submits a form → Next.js Server Action.
2. Server Action validates input and calls `backend.ts`.
3. Same path as steps 3–6 above.
4. Server Action returns a typed result and revalidates affected `cacheTag`s.

## Auth flow

1. Browser → Next.js Route Handler `/api/auth/login` with credentials.
2. Route Handler → backend `/api/Auth/login`.
3. Backend validates, signs JWT (RS256), returns `{ token, user }`.
4. Route Handler sets the `session` cookie (`httpOnly`, `Secure`, `SameSite`).
5. Subsequent requests carry the cookie → middleware verifies → claims attached to request headers.

## Environment layout

- `frontend/` — Next.js, port 3000 (dev).
- `services/api-gateway/` — Go, port 8080 (dev).
- `backend/` — .NET, port 5101 (dev).
- PostgreSQL — port 5432 (dev, via `docker-compose.dev.yml`).

After Phase 4, the backend is **not** exposed externally. The gateway is the only external ingress alongside Next.js.

## Migration phases

See ADR 0001. Phase 1 is scaffolding (this PR). Phases 2–5 follow in subsequent PRs.
