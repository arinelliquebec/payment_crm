---
paths:
  - "services/api-gateway/**/*.go"
  - "services/api-gateway/go.mod"
  - "services/api-gateway/Dockerfile"
---

# API Gateway (Go)

Thin gateway. Single ingress for backend + future microservices.

## Scope

In:

- routing
- JWT signature + expiry validation (no issuance)
- CORS
- rate limiting (per-IP, per-user)
- correlation / request IDs
- structured logging
- header injection (`X-User-Id`, `X-User-Login`, `X-User-Groups`) from JWT claims
- hop-by-hop header strip
- TLS termination
- body size + timeout enforcement
- liveness / readiness probes

Out:

- DTO transformation
- cross-resource aggregation
- business / domain rules
- DB access
- view shaping
- AuthZ rules (RBAC stays in backend)
- gRPC translation (separate ADR if needed)

## Rules

- gateway must not read or rewrite request bodies for transformation
- new packages outside `internal/{config,middleware,proxy,auth,observability}` require an ADR
- new middleware that reads response bodies requires an ADR
- public routes are listed explicitly in config; default is JWT-required
- never log JWT contents, request bodies, or PII; log method, path, status, latency, correlation ID, claim subject
- propagate `context.Context` through all I/O paths
- return typed errors with stable shape: `{ "error": string, "request_id": string }`

## Layout

```
cmd/server/main.go
internal/
  config/         env-driven config
  auth/           JWT verify (JWKS)
  middleware/     correlation, logging, cors, ratelimit, jwt
  proxy/          reverse proxy to backend
  observability/  metrics, traces
```

## See also

- `docs/adr/0003-api-gateway-thinness.md`
- `docs/adr/0002-jwt-issuance-authority.md`
- `docs/architecture/target-architecture.md`
