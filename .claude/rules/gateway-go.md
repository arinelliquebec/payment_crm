---
paths:
  - "gateway/**/*.go"
  - "gateway/go.mod"
  - "gateway/go.sum"
  - "gateway/Dockerfile"
---

# Go API Gateway

The Gateway is a thin edge/backend boundary.

Responsibilities:
- HTTP routing
- CORS
- auth boundary
- rate limiting
- request/correlation IDs
- structured logging
- panic recovery
- health/readiness endpoints
- proxying to backend services

Forbidden:
- core business logic
- frontend-specific orchestration
- direct PostgreSQL access
- domain workflows
- persistence logic

Rules:
- use context propagation
- use graceful shutdown
- keep handlers thin
- isolate backend clients
- forward correlation IDs
- expose `/healthz` and `/readyz`
- keep configuration environment-based
- never commit secrets