# 0001 — BFF deprecation

**Status:** Accepted (NestJS BFF removed from repo; proxy/auth live in Next.js)
**Date:** 2026-05-02

## Context

`bff/` (NestJS) previously ran as an auth-aware reverse proxy: it re-signed JWTs with its own secret and forwarded requests to the .NET backend. The advertised orchestration role (aggregation, caching, rate limiting, DTO transformation, correlation IDs) was documented but largely not implemented in code.

Maintaining the BFF as a separate Node.js service added:

- another deploy target
- a JWT issuer split-brain (BFF + backend both signing tokens the backend accepts)
- a network hop with no value-add
- duplicated CORS / cookie configuration
- a runtime that is not the natural place for view-shaped data fetching in a Next.js 16 app

Next.js 16 + React 19 provide first-class server-side primitives — Route Handlers, Server Components, Server Actions, server-only modules, and middleware — that cover the orchestration surface natively, on the same domain, in the same deploy.

## Decision

Remove the NestJS BFF. Move BFF responsibilities as follows:

- **Frontend-specific orchestration** (auth flow cookies, BFF-shaped session JWT, same-origin API proxy) → Next.js Route Handlers under `frontend/src/app/api/` (e.g. `auth/*`, `backend/[...path]`).
- **Cross-cutting platform concerns** (auth boundary, CORS, rate limiting, correlation IDs, logging, reverse proxy) → Go gateway module at `gateway/` (separate deploy target from the Next app).
- **Domain rules** → remain in `backend/` (.NET).

The `bff/` package and directory were removed from the monorepo after the Next.js routes above were in place.

## Consequences

Positive:

- backend remains source of truth for login validation; Next.js issues a thin session cookie for browser → backend calls (aligned with prior BFF behavior)
- one fewer service to deploy and monitor
- view-shaped fetching colocated with views
- typed Server Actions replace untyped REST endpoints

Negative:

- migration risk during cutover (mitigated by feature flags and a dual-cookie window)
- the Go gateway is a new operational concern
- frontend developers must internalize the server / client boundary
- the Next.js deploy must configure `JWT_SECRET` (and related cookie settings) for production; never commit secrets

## Migration

See `docs/architecture/target-architecture.md`. Phases (completed vs ongoing):

0. scaffolding — Go `gateway/`, Next health and API routes
1. auth + API proxy into Next.js (`/api/auth/*`, `/api/backend/*`)
2. Go gateway operational in front of clients (when wired in DNS / infra)
3. server-side aggregation (optional, incremental)
4. BFF decommission — **done** (`bff/` removed from repo)
5. hardening
