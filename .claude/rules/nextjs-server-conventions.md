---
paths:
  - "frontend/src/server/**/*.{ts,tsx}"
  - "frontend/src/app/api/**/*.{ts,tsx}"
  - "frontend/src/middleware.ts"
  - "frontend/src/app/**/page.{ts,tsx}"
  - "frontend/src/app/**/layout.{ts,tsx}"
---

# Next.js server-side conventions

The Next.js app hosts the frontend and the lightweight orchestration layer that replaces the legacy NestJS BFF.

## Server / client boundary

- Server Components by default. Use `'use client'` only for interactivity, browser APIs, local UI state, effects, or event handlers.
- `frontend/src/server/` is server-only. Every file in it starts with `import "server-only"`.
- Client Components must not import from `frontend/src/server/`.
- Backend calls go through `frontend/src/server/clients/backend.ts`. Do not call gateway URLs directly from components.

## Auth

- Session cookie name: `session` (replaces `bff_session`).
- JWT verification happens in `frontend/src/middleware.ts` using `jose.jwtVerify` against the JWKS at `${BACKEND_URL}/.well-known/jwks.json`.
- Middleware injects `x-user-id`, `x-user-login`, `x-user-groups` request headers.
- Route Handlers and Server Actions read the user from these headers, never from the cookie directly.
- The Next.js app does not issue JWTs. Issuance is the backend's responsibility.

## Route Handlers

- Live under `frontend/src/app/api/**/route.ts`.
- Authenticated handlers rely on middleware having validated the session.
- Public handlers (e.g., `/api/auth/login`, `/api/portal-cliente/auth`) are listed in the middleware public-path matcher.
- Use `NextResponse.json` for JSON, and `cookies()` from `next/headers` for cookies.

## Server Actions

- Live under `frontend/src/server/actions/<resource>.ts`.
- Always validate input (`zod` or equivalent).
- Call `frontend/src/server/clients/backend.ts` for backend interaction.
- Call `revalidateTag` after writes that affect cached reads.

## Backend client

- Single typed client at `frontend/src/server/clients/backend.ts`.
- Reads gateway URL from `process.env.API_GATEWAY_URL`.
- Always forwards `Authorization: Bearer ${sessionCookie}`.
- Returns typed responses. Backend response types live in `frontend/src/server/clients/types.ts`.

## Forbidden

- Direct PostgreSQL access from anywhere in `frontend/`.
- Business or domain rules in `frontend/` (belongs in `backend/`).
- Calls from Client Components to the gateway or backend.
- Importing `frontend/src/server/**` from Client Components.
- Logging full request or response bodies (PII risk). Log shape and correlation ID instead.

## Caching

- `cache()` for per-request memoization across an RSC tree.
- `unstable_cache` + `cacheTag` for cross-request caching.
- Invalidate via `revalidateTag` in Server Actions.

## See also

- `docs/architecture/target-architecture.md`
- `docs/adr/0001-bff-deprecation.md`
- `frontend/src/server/README.md`
