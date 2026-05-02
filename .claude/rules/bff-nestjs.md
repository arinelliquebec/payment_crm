---
paths:
  - "bff/**/*.{ts,js}"
  - "bff/package.json"
  - "bff/tsconfig*.json"
---

# BFF: NestJS

The BFF exists for frontend-specific orchestration.

Responsibilities:
- aggregate backend responses
- adapt backend DTOs to frontend contracts
- manage user/session context
- call backend APIs or gRPC services
- hide internal service topology from the frontend

Do not turn the BFF into the core domain layer.

Rules:
- controllers stay thin
- services orchestrate use cases
- use DTOs and validation pipes
- use guards for auth boundaries
- use filters for consistent errors
- use interceptors for logging, tracing, and correlation IDs
- isolate backend clients
- keep frontend-facing contracts stable

Do not put database access directly in controllers.