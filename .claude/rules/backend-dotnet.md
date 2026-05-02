---
paths:
  - "backend/**/*.cs"
  - "backend/**/*.csproj"
  - "backend/**/*.sln"
  - "*.sln"
---

# Backend Core: .NET 10

The .NET backend owns core domain logic and high-value business workflows.

Prefer Clean Architecture:

- Domain
- Application
- Infrastructure
- API/Presentation

Dependency direction:
- API may depend on Application
- Application may depend on Domain
- Infrastructure may implement Application interfaces
- Domain must not depend on Infrastructure

Rules:
- keep controllers thin
- keep business rules in Domain/Application
- keep persistence in Infrastructure
- use cancellation tokens
- use nullable reference types
- use async I/O for I/O-bound work
- avoid business logic in controllers or EF configuration
- write tests for domain invariants and application use cases