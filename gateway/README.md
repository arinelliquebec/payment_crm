# gateway

Thin Go API Gateway. Single ingress for the `.NET` backend and any future
microservices.

## Status

Phase 1 skeleton. The service builds and starts. Middleware chain is wired
(correlation, logging, recovery, CORS, per-IP rate limit, auth boundary).
Health and readiness endpoints are live. The proxy layer is a documented
placeholder and returns `501 Not Implemented`.

## Scope

In:
- HTTP routing
- CORS
- request / correlation IDs
- structured logging (`log/slog`)
- panic recovery
- per-IP rate limiting on `/api/*` (`golang.org/x/time/rate`)
- `/healthz` and `/readyz`
- environment-based configuration
- graceful shutdown
- placeholder backend proxy / client layer

Out (per `CLAUDE.md` and `.claude/rules/gateway-go.md`):
- core business logic
- direct PostgreSQL access
- domain workflows / persistence
- DTO transformation / aggregation
- real JWT issuance or signing keys

## Run (dev)

```sh
cd gateway
cp .env.example .env   # edit values as needed
go run ./cmd/gateway
```

Or with explicit env:

```sh
LISTEN_ADDR=":8080" BACKEND_URL="http://localhost:5101" \
  ALLOWED_ORIGINS="http://localhost:3000" \
  go run ./cmd/gateway
```

## Endpoints

| Path        | Purpose                                           |
| ----------- | ------------------------------------------------- |
| `/healthz`  | Liveness. Always 200 if process is up.            |
| `/readyz`   | Readiness. 200 once internal checks pass.         |
| `/api/*`    | Proxy boundary. Currently 501 (placeholder).      |

## Layout

```
cmd/gateway/main.go              bootstrap, signal handling, graceful shutdown
internal/config/                 env-based config loader
internal/logging/                slog setup helpers
internal/httpserver/             router wiring and health/readiness handlers
internal/middleware/             correlation, logging, recovery, CORS, auth
internal/proxy/                  placeholder upstream proxy
```

## Build

```sh
go build -o bin/gateway ./cmd/gateway
```

## Test

```sh
go test ./...
```

## Notes

- Single third-party dependency: `golang.org/x/time/rate` (token-bucket
  limiter). Any further dependency requires explicit approval per
  `CLAUDE.md`.
- Rate limiting is **per-IP**, applied **only to `/api/*`**, and **disabled
  by default** (`RATE_LIMIT_RPS=0`). It uses `RemoteAddr`. When deploying
  behind a trusted reverse proxy, a future middleware must rewrite
  `RemoteAddr` from `X-Forwarded-For` before this layer.
- Real JWT validation, JWKS fetching, and header injection of validated
  claims are intentionally **not** implemented in this phase.
