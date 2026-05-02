---
paths:
  - "**/*.test.*"
  - "**/*.spec.*"
  - "**/tests/**/*"
  - "frontend/**/*.{ts,tsx}"
  - "bff/**/*.{ts,js}"
  - "backend/**/*.{cs,go}"
  - "test-menu-navigation.sh"
---

# Testing

Use a practical testing pyramid:

- unit tests for domain/service logic
- integration tests for persistence/API boundaries
- contract tests for REST/gRPC boundaries
- E2E tests only for critical flows

Before large refactors:
1. identify risky behavior
2. add characterization tests if missing
3. refactor incrementally
4. preserve public contracts

Frontend:
- test important UI behavior
- test forms and validation
- avoid brittle snapshot-heavy tests

BFF:
- test services, controllers, guards, filters, and backend clients

Backend:
- test domain invariants
- test application use cases
- test critical API behavior