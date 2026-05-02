---
paths:
  - "package.json"
  - "pnpm-lock.yaml"
  - "pnpm-workspace.yaml"
  - "frontend/package.json"
  - "bff/package.json"
---

# Monorepo / PNPM Workspace

This repository uses a root-level monorepo structure.

Current major workspaces:
- frontend
- bff
- backend

Before changing scripts or dependencies:
1. inspect root `package.json`
2. inspect `pnpm-workspace.yaml`
3. inspect package-level `package.json` files
4. prefer existing scripts
5. avoid adding duplicate dependencies across packages

Do not restructure the monorepo unless explicitly requested.

Prefer incremental changes that preserve current folder names.