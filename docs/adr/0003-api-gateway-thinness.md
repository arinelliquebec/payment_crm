# 0003 — API gateway thinness

**Status:** Proposed
**Date:** 2026-05-02

## Context

API gateways drift toward becoming a second business-logic layer when teams add aggregation, transformation, and shaping at the edge. This duplicates domain rules and creates a fragile, hard-to-test middle tier.

`bff/` already proved this in the project: advertised as an orchestration layer, it became a passthrough proxy, and the orchestration value never materialized.

## Decision

The Go gateway at `services/api-gateway/` is **thin**. Strict scope:

**In scope**

- routing (path-based)
- JWT signature + expiry validation (no issuance)
- CORS
- rate limiting (per-IP, per-user)
- correlation / request IDs
- structured request / response logging
- header injection (`X-User-Id`, `X-User-Login`, `X-User-Groups`) from validated claims
- hop-by-hop header strip
- TLS termination (or behind a load balancer)
- body size + timeout enforcement
- liveness / readiness probes

**Out of scope** (move work elsewhere or push back)

- DTO transformation → backend or Next.js server modules
- cross-resource aggregation → Next.js Server Components
- business / domain rules → backend
- DB access → backend
- view shaping → Next.js
- AuthZ rules (RBAC, group permissions) → backend
- gRPC ↔ REST translation → separate ADR if ever needed

## Enforcement

- code review must reject new gateway middleware that reads or rewrites request bodies for transformation
- new gateway packages outside `internal/{config,middleware,proxy,auth,observability}` require an ADR
- a request that needs aggregation gets a Next.js Server Component or Server Action, not a gateway aggregator endpoint
- `.claude/rules/api-gateway.md` mirrors this scope for AI-assisted edits

## Consequences

Positive:

- gateway stays small and auditable
- domain logic stays in backend; view logic in Next.js
- gateway becomes replaceable infrastructure (could swap for Envoy or Traefik) without losing business logic

Negative:

- engineers may push to add orchestration "just here"; the rule must hold
- aggregation patterns require RSC literacy on the frontend
