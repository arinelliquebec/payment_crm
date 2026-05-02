# Target architecture

## Topology

```
Browser
  │
  │ HTTPS, same-origin
  ▼
Next.js (frontend/)
  ├─ React Server Components / Client Components
  ├─ Route Handlers (app/api/*): `/api/auth/*`, `/api/backend/*` (proxy → .NET), `/api/health`, portal, etc.
  ├─ Server Actions (forms, mutations)
  ├─ Middleware
  └─ frontend/src/server/      (server-only modules)
        │
        │ fetch server-side (BACKEND_URL)
        ▼
   .NET Backend (backend/)
        ├─ /api/Auth/login
        ├─ domain + use cases
        ├─ EF Core → PostgreSQL
        └─ integrations: Santander, Azure Blob, Azure OpenAI, Resend

   gateway/ (Go) — edge planejado (CLAUDE.md, ADR 0003); ainda não substitui o proxy `/api/backend` no browser.
```

## Component responsibilities

### Next.js (`frontend/`)

- All UI rendering (RSC by default, client islands where needed).
- Route Handlers: `/api/auth/*` (login, cookie `bff_session`, JWT HS256 compatível com o antigo BFF), `/api/backend/*` (proxy autenticado → .NET), `/api/health`, portal, NFS-e, etc.
- Server Actions for writes.
- `frontend/src/server/` onde aplicável (server-only).
- No direct PostgreSQL access. No core domain rules in the frontend layer.

### Go API Gateway (`gateway/`)

- Thin edge em Go (ver `gateway/`): routing, CORS, correlation IDs, logging, health, rate limit.
- Evolução possível: ingress à frente do .NET, alinhado a ADR 0003.

### Backend (`backend/`, .NET)

- Domain entities and use cases.
- EF Core migrations against PostgreSQL.
- REST incluindo `/api/Auth/login`.
- Authorization (RBAC), audit, integrações externas.

### NestJS BFF (`bff/`)

- **Removido.** Responsabilidades migradas para Route Handlers no Next. Ver `docs/adr/0001-bff-deprecation.md`.

## Request flow (authenticated read — cliente)

1. Browser → Next.js (mesma origem): página ou dados via `apiClient` com base `/api/backend`.
2. Route Handler em `/api/backend/*` valida cookie `bff_session`, repassa `Authorization: Bearer` e headers de auditoria ao .NET.
3. Backend autoriza, consulta Postgres, devolve JSON.
4. Next entrega a resposta ao browser.

## Request flow (authenticated read — exemplos RSC/server)

1. Onde existir cliente server-only para o .NET, o fetch usa `BACKEND_URL` no servidor com o token/cookie apropriado ao fluxo.

## Request flow (authenticated write — Server Action)

1. Browser submete formulário → Server Action.
2. Server Action valida e chama o backend (padrão do módulo server-side em uso).
3. Retorno tipado e revalidação de cache quando aplicável.

## Auth flow (implementação atual)

1. Browser → `POST /api/auth/login` (Next) com credenciais.
2. Next → `POST` .NET `/api/Auth/login`.
3. .NET valida e devolve DTO do usuário.
4. Next assina JWT HS256 (payload alinhado ao antigo BFF), define cookie httpOnly `bff_session`.
5. Chamadas `/api/backend/*` enviam o token no header `Authorization` e injetam `X-Usuario-*` como o Nest fazia.

## Environment layout

- `frontend/` — Next.js, port 3000 (dev).
- `gateway/` — Go (quando em uso), ver `gateway/README.md`.
- `backend/` — .NET, port 5101 (dev).
- PostgreSQL — port 5432 (dev, via `docker-compose.dev.yml`).

## Migration phases

See ADR 0001. O diretório `bff/` foi removido após migração dos fluxos para o Next.
