# frontend/src/server/

Server-only modules. **Never import from a Client Component.**

## Layout

```
auth/
  jwt.ts          JWT verify (jose). Used by Route Handlers and middleware.
  session.ts      cookie read/write helpers (cookies() from next/headers)

clients/
  backend.ts      typed REST client. Single source for backend calls.
  types.ts        backend response types (mirror of backend DTOs)

actions/
  <resource>.ts   Server Actions per resource (clientes.ts, contratos.ts, …)

cache.ts          unstable_cache + cacheTag wrappers

README.md         this file
```

## Conventions

- Every file in this tree starts with `import "server-only"` to fail loudly if a Client Component imports it.
- Backend calls go through `clients/backend.ts`. Do not call `fetch` to the gateway from Server Components directly.
- `clients/backend.ts` reads the gateway URL from `process.env.API_GATEWAY_URL` (server-side only). Never use `NEXT_PUBLIC_*` for the gateway URL.
- Server Actions live under `actions/<resource>.ts` and are imported by client forms via the `'use server'` annotation.
- Auth: cookie + JWT verify happens in middleware. Server Actions and Route Handlers read the user from request headers `x-user-id`, `x-user-login` set by middleware.
- Caching: use `cache()` for per-request memoization, `unstable_cache` with `cacheTag` for cross-request caching. Invalidate via `revalidateTag` from Server Actions.

## Anti-patterns

- ❌ `'use client'` files importing from this tree
- ❌ Direct `fetch` to backend from Client Components (must go through Route Handler / Server Action)
- ❌ Business rules in this tree (belongs in `backend/`)
- ❌ Database access (this tree must not talk to Postgres directly)
- ❌ Reading `process.env.API_GATEWAY_URL` from anywhere outside `clients/backend.ts`

## Status

Phase 1: scaffolding only. This README defines conventions. Concrete implementations land in Phases 2–3.

## See also

- `docs/adr/0001-bff-deprecation.md`
- `docs/architecture/target-architecture.md`
- `.claude/rules/nextjs-server-conventions.md`
