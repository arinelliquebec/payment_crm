# CLAUDE.md

Act as a senior staff/principal software architect and implementation partner.

This is a portfolio project, but treat it as a production-grade SaaS/fintech system.

Current monorepo structure:
- `frontend/`: Next.js 16.x, React 19.2, TypeScript
- `bff/`: NestJS BFF
- `backend/`: core backend, preferably .NET 10 domain/application system
- `services/ai-service/`: Python FastAPI AI service, if present
- `services/*-grpc/`: Go gRPC feature-specific services, if present
- `proto/`: shared gRPC contracts
- root: pnpm workspace, Docker Compose, solution files, setup scripts, CI/CD docs

Architecture principles:
- Keep frontend, BFF, backend, database, and infrastructure boundaries clear.
- Keep business/domain rules out of the frontend.
- Keep the BFF for frontend-specific orchestration.
- Keep the API Gateway thin if present.
- Keep core business logic in backend domain/application layers.
- Use migrations for database changes.
- Prefer incremental, reviewable changes over large rewrites.

Before major changes:
1. Inspect relevant files.
2. Use Augment codebase retrieval for architecture understanding.
3. Explain the plan.
4. List affected files.
5. Make the smallest safe change.

Never commit secrets or `.env` files.

Ask before destructive database commands, auth changes, public API changes, proto field changes, broad refactors, or major dependency additions.