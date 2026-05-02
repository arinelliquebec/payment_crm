# CLAUDE.md

## Repository Exploration Policy

When repository context is needed, do not guess.

If Augment codebase-retrieval is available, use it.

If Augment is not available in the current environment, use Claude Code native tools instead:
- Glob to map files and folders
- Grep to find symbols, routes, DTOs, services, configs, migrations, and usages
- Read to inspect relevant files
- Explore subagent for broader repository investigation

Before architecture reviews, refactors, bug investigations, or cross-file changes:
1. Map the relevant repository structure.
2. Identify involved frontend, BFF, backend, services, database, and infra files.
3. Read the most relevant files.
4. Summarize the current implementation.
5. Explain the plan before editing.
6. Avoid broad changes unless explicitly requested.

Do not assume architecture from folder names alone.

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