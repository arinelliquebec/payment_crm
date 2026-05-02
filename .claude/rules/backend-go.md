---
paths:
  - "backend/**/*.go"
  - "backend/go.mod"
  - "backend/go.sum"
---

# Backend Go / API Gateway / gRPC

For Go API Gateway code, keep the gateway thin.

Gateway responsibilities:
- routing
- auth boundary
- CORS
- rate limiting
- correlation IDs
- logging
- health/readiness checks

Do not put core business logic in the gateway.

For Go gRPC services:
- keep services focused around bounded contexts
- use context propagation
- use deadlines and cancellation
- use structured logs
- use typed errors
- add health checks
- keep interfaces small and near consumers
- write tests for service/domain logic