---
paths:
  - "frontend/**/*.{ts,tsx,js,jsx}"
  - "frontend/package.json"
  - "frontend/next.config.*"
  - "frontend/tsconfig.json"
---

# Frontend: Next.js 16.x / React 19.2

Use Server Components by default. Use Client Components only for interactivity, browser APIs, local UI state, effects, or event handlers.

The frontend must not contain core business rules, secrets, database access, or direct calls to internal services.

Call the BFF or public API Gateway only.

Prefer:
- strict TypeScript
- typed API clients
- runtime validation
- accessible components
- small components
- explicit loading, error, and empty states

Avoid:
- unnecessary global state
- large components
- duplicated DTOs
- backend/domain logic in UI components
- leaking internal backend errors to users

Keep API access isolated under frontend API/client modules.