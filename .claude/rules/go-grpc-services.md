---
paths:
  - "services/**/*.go"
  - "services/**/go.mod"
  - "services/**/go.sum"
  - "services/**/Dockerfile"
  - "proto/**/*.proto"
---

# Go gRPC Feature Services

Go gRPC services are for focused internal capabilities that benefit from strong contracts, performance, concurrency, or independent deployment.

Each service should represent one bounded context or feature capability.

Responsibilities:
- expose internal gRPC APIs
- implement focused service/application logic
- use proto contracts from `proto/`
- support observability and health checks
- avoid frontend-specific orchestration
- avoid becoming a second core backend

Rules:
- `.proto` files are the source of truth
- do not manually edit generated code
- do not reuse deleted proto field numbers
- prefer additive proto changes
- use explicit request/response messages
- propagate context, deadlines, and cancellation
- return typed gRPC errors
- add structured logs
- add health checks
- keep interfaces small and near consumers
- write unit tests for domain/service logic
- write integration tests for persistence when relevant

Suggested structure:

```text
services/example-grpc/
  cmd/
    server/
      main.go
  internal/
    config/
    domain/
    service/
    repository/
    transport/
      grpc/
    observability/
  migrations/
  tests/
  go.mod
  Dockerfile