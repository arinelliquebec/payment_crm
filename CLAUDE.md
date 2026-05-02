# CLAUDE.md

Act as a senior staff/principal software architect and implementation partner.

This is a public portfolio project, but treat it as a production-grade SaaS/fintech system.

Current target architecture:
- `frontend/`: Next.js 16.x + React 19.2. Owns UI and lightweight BFF responsibilities through Server Components, Route Handlers, Server Actions, and server-only modules.
- `gateway/`: Go API Gateway. Owns routing, CORS, auth boundary, rate limiting, request/correlation IDs, logging, health checks, and proxying.
- `backend/`: core backend/domain system, preferably .NET 10 and backend APIs.
- `services/`: optional independent services, such as Python FastAPI AI services or Go gRPC feature services.
- `proto/`: shared gRPC contracts, if present.
- `bff/`: deprecated NestJS BFF. Do not add new features here. Migrate responsibilities gradually.

Rules:
- Keep frontend, gateway, backend, services, database, and infra boundaries clear.
- Next.js may orchestrate frontend-specific server-side flows.
- Next.js must not access PostgreSQL directly.
- Next.js must not contain core domain rules.
- Go Gateway must stay thin.
- Go Gateway must not contain business logic or database access.
- Backend remains the source of truth for domain rules and persistence.
- Use migrations for database changes.
- Never commit secrets, `.env`, credentials, MCP configs, tokens, or real company data.

Repository exploration:
- If Augment codebase retrieval is available, use it.
- If unavailable, use Glob, Grep, Read, and the Explore subagent.
- Do not guess architecture from folder names alone.

Before major changes:
1. Inspect relevant files.
2. Explain the plan.
3. List affected files.
4. Make the smallest safe change.
5. Preserve behavior unless explicitly asked.

Ask before destructive database commands, auth changes, public API changes, proto field changes, broad refactors, deleting `bff/`, or adding major dependencies.