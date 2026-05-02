# 0001 — BFF deprecation

**Status:** Proposed
**Date:** 2026-05-02

## Context

`bff/` (NestJS) currently runs as an auth-aware reverse proxy. It re-signs JWTs with its own secret and forwards `/api/*` to the .NET backend. The advertised orchestration role (aggregation, caching, rate limiting, DTO transformation, correlation IDs) is documented in `frontend/BFF_ARCHITECTURE_GUIDE.md` but is not implemented in the codebase.

Maintaining the BFF as a separate Node.js service adds:

- another deploy target
- a JWT issuer split-brain (BFF + backend both signing tokens the backend accepts)
- a network hop with no value-add
- duplicated CORS / cookie configuration
- a runtime that is not the natural place for view-shaped data fetching in a Next.js 16 app

Next.js 16 + React 19 provide first-class server-side primitives — Route Handlers, Server Components, Server Actions, server-only modules, and middleware — that cover the orchestration surface natively, on the same domain, in the same deploy.

## Decision

Remove the NestJS BFF. Move BFF responsibilities as follows:

- **Frontend-specific orchestration** (auth flow cookies, view aggregation, DTO adaptation) → Next.js `frontend/src/server/` accessed from Server Components, Route Handlers, and Server Actions.
- **Cross-cutting platform concerns** (auth boundary, CORS, rate limiting, correlation IDs, logging, proxy) → new Go API gateway at `services/api-gateway/`.
- **Domain rules and JWT issuance** → remain in `backend/` (.NET).

`bff/` is kept running until the migration completes. Removal lands as the final phase.

## Consequences

Positive:

- single auth issuer (backend), no token re-signing
- one fewer service to deploy and monitor
- view-shaped fetching colocated with views
- typed Server Actions replace untyped REST endpoints
- frontend never holds a JWT signing secret

Negative:

- migration risk during cutover (mitigated by feature flags and a dual-cookie window)
- the Go gateway is a new operational concern
- frontend developers must internalize the server / client boundary

## Migration

See `docs/architecture/target-architecture.md`. Phases:

0. scaffolding (this PR)
1. auth into Next.js
2. Go gateway live
3. server-side aggregation
4. BFF decommission
5. hardening
