---
paths:
  - "proto/**/*.proto"
  - "services/**/*.proto"
  - "services/**/*.pb.go"
  - "frontend/**/*api/**/*"
  - "frontend/**/*client/**/*"
  - "backend/**/*Contracts*"
  - "backend/**/*Dto*"
---

# Contracts: REST, DTOs, gRPC

Contracts define system boundaries.

Rules:
- keep external API responses stable
- validate all external input
- use explicit request/response DTOs
- do not leak database models directly to clients
- do not leak internal service topology
- use consistent error shapes
- include correlation IDs in errors when possible

For gRPC:
- `.proto` files live under `proto/`
- never reuse deleted field numbers
- never change existing field numbers casually
- prefer additive changes
- version APIs when breaking changes are required
- keep generated code separate from handwritten code

For frontend contracts:
- keep DTOs frontend-friendly
- avoid duplicating deep backend domain models
