---
paths:
  - "frontend/**/*.{ts,tsx,js,jsx}"
  - "frontend/app/api/**/*"
  - "frontend/app/**/*"
  - "frontend/server/**/*"
  - "frontend/lib/**/*"
---

# Next.js Frontend + Lightweight BFF

Next.js owns UI and frontend-specific server-side orchestration.

Allowed:
- Server Components for server-side data loading
- Route Handlers for frontend-facing API endpoints
- Server Actions for form/use-case interactions
- server-only modules for backend API clients
- mapping backend DTOs to frontend-friendly view models

Forbidden:
- direct PostgreSQL access
- core business/domain rules
- secrets in client code
- direct browser calls to internal services
- exposing internal backend URLs
- duplicating backend authorization logic

Rules:
- keep backend calls server-side
- use typed clients
- validate external responses
- return consistent frontend-facing errors
- keep route handlers thin
- keep orchestration in server modules
- use `server-only` for modules that must never run in the browser