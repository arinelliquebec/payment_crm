# 0002 — JWT issuance authority

**Status:** Proposed
**Date:** 2026-05-02

## Context

The .NET backend currently issues a JWT at `POST /api/Auth/login`. The BFF receives the response payload and re-signs a separate JWT with its own secret. The proxy then forwards the BFF JWT back to .NET as a `Bearer` token. This requires the JWT secret to be aligned between BFF and backend, or the chain breaks silently. Either way, BFF compromise leaks the ability to mint tokens that the backend trusts.

The new architecture has multiple validators (Go gateway, Next.js middleware) and benefits from a single authoritative issuer.

## Decision

- **Single issuer:** `backend/` (.NET) at `POST /api/Auth/login`. Backend returns its JWT directly. No re-signing anywhere.
- **Validators:** Go gateway and Next.js middleware. Both verify only.
- **Algorithm:** RS256. Backend holds the private key. Backend exposes the public key set at `/.well-known/jwks.json`.
- Validators fetch JWKS at startup and cache with a TTL (suggest 10 min) plus an on-`kid`-miss refresh.
- No shared secrets between services.
- Token claims: `sub`, `login`, `nome`, `email`, `groups`, `filialId`, `consultorId`, `tipoPessoa`, `iat`, `exp`. Match the current `BffUserPayload` shape; rename in transit later if needed.
- Cookie: `session` (replacing `bff_session`). `httpOnly`, `Secure` in prod, `SameSite=Strict` in prod, `SameSite=Lax` in dev.
- Expiry: 8 hours. Sliding refresh via `/api/auth/refresh` lands in Phase 2 or later (separate ADR).

## Consequences

Positive:

- single source of truth for identity
- key rotation via JWKS without redeploying validators
- BFF compromise no longer mints valid tokens (BFF gone)
- frontend never sees the signing secret

Negative:

- backend must implement the JWKS endpoint
- validators must handle JWKS fetch failure gracefully (start in degraded mode, refuse traffic)
- a migration window with both `bff_session` and `session` cookies — frontend must read either during cutover

## Open

- whether to add refresh tokens (separate ADR)
- key rotation cadence and tooling
