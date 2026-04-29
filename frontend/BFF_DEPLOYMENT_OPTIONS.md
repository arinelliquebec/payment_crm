# Opções de Deploy: Next.js + NestJS BFF

## ✅ Arquitetura Correta

```
┌─────────────────┐
│   Usuário       │
│   (Browser)     │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────────────────────────────┐
│   FRONTEND (Next.js)                    │
│   - UI/UX                               │
│   - SSR/SSG                             │
│   - React Components                    │
└────────┬────────────────────────────────┘
         │ HTTP/REST + WebSocket
         │ (NUNCA fala direto com .NET)
         ▼
┌─────────────────────────────────────────┐
│   BFF (NestJS)                          │
│   - Agregação de dados                  │
│   - Cache (Redis)                       │
│   - Autenticação JWT                    │
│   - Rate Limiting                       │
│   - WebSockets                          │
│   - Transformação de dados              │
└────────┬────────────────────────────────┘
         │ HTTP/REST
         │ (Única conexão com .NET)
         ▼
┌─────────────────────────────────────────┐
│   BACKEND (.NET 10 Monolito)            │
│   - Business Logic                      │
│   - Database (SQL Server)               │
│   - Domain Models                       │
└─────────────────────────────────────────┘
```

**Fluxo de Comunicação:**

1. ✅ Next.js → NestJS BFF
2. ✅ NestJS BFF → .NET Backend
3. ❌ Next.js → .NET Backend (NÃO MAIS!)

## Opções de Deploy

### Opção 1: Vercel (Next.js) + Separado (NestJS) ⭐ RECOMENDADO

```
┌──────────────────────────────────────────────────────────────┐
│                         VERCEL                                │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Next.js Frontend                                      │  │
│  │  - Edge Functions                                      │  │
│  │  - SSR/SSG                                             │  │
│  │  - CDN Global                                          │  │
│  │  URL: https://arrighi.com                              │  │
│  └────────────────────────────────────────────────────────┘  │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         │ HTTPS
                         ▼
┌──────────────────────────────────────────────────────────────┐
│              AWS / Railway / Render / Fly.io                  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  NestJS BFF                                            │  │
│  │  - API REST                                            │  │
│  │  - WebSockets                                          │  │
│  │  - Redis Cache                                         │  │
│  │  URL: https://api.arrighi.com                          │  │
│  └────────────────────────────────────────────────────────┘  │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         │ HTTPS
                         ▼
┌──────────────────────────────────────────────────────────────┐
│              Seu Servidor Atual (.NET)                        │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  .NET 10 Backend                                       │  │
│  │  - Business Logic                                      │  │
│  │  - SQL Server                                          │  │
│  │  URL: https://backend.arrighi.com (privado)           │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```



- ✅ Next.js otimizado na Vercel (melhor performance)
- ✅ NestJS em servidor dedicado (melhor para WebSockets)
- ✅ Escalabilidade independente
- ✅ Custos otimizados

**Custos Estimados:**

- Vercel: $0 (Hobby) ou $20/mês (Pro)
- Railway/Render: $5-20/mês (NestJS + Redis)
- .NET: Mantém onde está

### Opção 2: Tudo na Vercel (Monorepo) ⚠️ LIMITAÇÕES

```
┌──────────────────────────────────────────────────────────────┐
│                         VERCEL                                │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Next.js Frontend                                      │  │
│  │  URL: https://arrighi.com                              │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  NestJS BFF (Serverless Functions)                    │  │
│  │  URL: https://arrighi.com/api/*                        │  │
│  │  ⚠️ LIMITAÇÕES:                                        │  │
│  │  - Sem WebSockets nativos                             │  │
│  │  - Timeout 10s (Hobby) / 60s (Pro)                    │  │
│  │  - Cold starts                                         │  │
│  │  - Redis externo necessário                           │  │
│  └────────────────────────────────────────────────────────┘  │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
                    .NET Backend
```


- ✅ Deploy único
- ✅ Configuração mais simples
- ✅ Monorepo Nx funciona bem

**Desvantagens:**

- ❌ WebSockets não funcionam nativamente
- ❌ Timeout de 10-60 segundos
- ❌ Cold starts (latência)
- ❌ Redis precisa ser externo (Upstash)
- ❌ Menos controle sobre o ambiente

### Opção 3: AWS/Azure (Tudo junto) 💰 MAIS CARO

```
┌──────────────────────────────────────────────────────────────┐
│                    AWS / Azure                                │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  ECS/Fargate ou App Service                            │  │
│  │                                                         │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │  │
│  │  │  Next.js     │  │  NestJS BFF  │  │   Redis     │ │  │
│  │  │  Container   │  │  Container   │  │  ElastiCache│ │  │
│  │  └──────────────┘  └──────────────┘  └─────────────┘ │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  .NET Backend                                          │  │
│  │  - Pode ficar no mesmo VPC                            │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

**Vantagens:**

- ✅ Controle total
- ✅ Rede privada (VPC)
- ✅ Escalabilidade automática
- ✅ WebSockets funcionam perfeitamente

**Desvantagens:**

- ❌ Mais caro ($50-200/mês)
- ❌ Mais complexo de configurar
- ❌ Requer conhecimento de DevOps

## 🎯 Recomendação: Opção 1 (Híbrida)

### Configuração Recomendada

```yaml
# Estrutura de Deploy
Frontend (Next.js):
  - Plataforma: Vercel
  - URL: https://arrighi.com
  - Custo: $0-20/mês
  - Features: SSR, Edge, CDN

BFF (NestJS):
  - Plataforma: Railway.app ou Render.com
  - URL: https://api.arrighi.com
  - Custo: $5-20/mês
  - Features: WebSockets, Redis, API REST

Backend (.NET):
  - Plataforma: Mantém onde está
  - URL: https://backend.arrighi.com (privado)
  - Acesso: Apenas do BFF
```

### Por que Railway/Render para o BFF?

**Railway.app** ⭐ MELHOR OPÇÃO

```yaml
Vantagens:
  - ✅ Deploy automático do GitHub
  - ✅ Redis incluído (grátis até 100MB)
  - ✅ WebSockets funcionam perfeitamente
  - ✅ Logs em tempo real
  - ✅ Variáveis de ambiente fáceis
  - ✅ $5/mês (starter)
  - ✅ Escala automaticamente
  - ✅ SSL grátis

Configuração: 1. Conecta GitHub
  2. Seleciona apps/bff
  3. Railway detecta NestJS automaticamente
  4. Adiciona Redis com 1 clique
  5. Deploy!
```

**Render.com** (Alternativa)

```yaml
Vantagens:
  - ✅ Plano gratuito disponível
  - ✅ WebSockets funcionam
  - ✅ Redis externo (Upstash grátis)
  - ✅ SSL grátis
  - ✅ Deploy automático

Desvantagens:
  - ⚠️ Plano grátis tem cold starts
  - ⚠️ Redis não incluído (precisa Upstash)
```

## Configuração Passo a Passo

### 1. Deploy do Frontend (Vercel)

```bash
# No diretório do projeto
cd arrighi-crm

# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Configurar variáveis de ambiente na Vercel
# NEXT_PUBLIC_API_URL=https://api.arrighi.com/api
# NEXT_PUBLIC_WS_URL=wss://api.arrighi.com
```

**vercel.json** (na raiz do frontend)

```json
{
  "buildCommand": "nx build frontend --prod",
  "outputDirectory": "dist/apps/frontend/.next",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_API_URL": "https://api.arrighi.com/api",
    "NEXT_PUBLIC_WS_URL": "wss://api.arrighi.com"
  }
}
```

### 2. Deploy do BFF (Railway)

```bash
# 1. Criar conta no Railway.app
# 2. Conectar GitHub
# 3. New Project → Deploy from GitHub repo
# 4. Selecionar: arrighi-crm
# 5. Root Directory: apps/bff
# 6. Railway detecta NestJS automaticamente
```

**railway.json** (na raiz do bff)

```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && nx build bff --prod"
  },
  "deploy": {
    "startCommand": "node dist/apps/bff/main.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**Variáveis de Ambiente no Railway:**

```bash
PORT=4000
NODE_ENV=production
BACKEND_API_URL=https://backend.arrighi.com/api
JWT_SECRET=seu-secret-super-seguro
REDIS_URL=${{Redis.REDIS_URL}}  # Railway injeta automaticamente
FRONTEND_URL=https://arrighi.com
```

### 3. Adicionar Redis no Railway

```bash
# No dashboard do Railway:
# 1. Clique em "New" → "Database" → "Add Redis"
# 2. Railway cria automaticamente
# 3. Variável ${{Redis.REDIS_URL}} fica disponível
```

### 4. Configurar .NET Backend

```json
// appsettings.Production.json
{
  "Cors": {
    "AllowedOrigins": [
      "https://api.arrighi.com", // Apenas BFF
      "https://arrighi.com" // Frontend (opcional, para dev)
    ]
  },
  "Jwt": {
    "Secret": "mesmo-secret-do-bff",
    "Issuer": "ArrighiCRM",
    "Audience": "ArrighiCRM"
  }
}
```

## Fluxo de Requisição Completo

```
1. Usuário acessa: https://arrighi.com
   ↓
2. Vercel serve Next.js (SSR)
   ↓
3. Frontend faz request: https://api.arrighi.com/api/clientes
   ↓
4. Railway (NestJS BFF) recebe
   ↓
5. BFF verifica cache (Redis)
   ├─ Cache hit → Retorna imediatamente
   └─ Cache miss → Continua
   ↓
6. BFF faz request: https://backend.arrighi.com/api/Cliente
   ↓
7. .NET Backend processa
   ↓
8. .NET retorna dados
   ↓
9. BFF transforma dados
   ↓
10. BFF salva no cache (Redis)
    ↓
11. BFF retorna para Frontend
    ↓
12. Frontend renderiza
```

## Custos Mensais Estimados

### Opção 1 (Recomendada)

```
Vercel (Next.js):        $0 (Hobby) ou $20 (Pro)
Railway (NestJS + Redis): $5 (Starter) ou $20 (Pro)
.NET Backend:            Mantém custo atual
─────────────────────────────────────────────────
TOTAL:                   $5-40/mês
```

### Opção 2 (Tudo Vercel)

```
Vercel Pro:              $20/mês
Upstash Redis:           $0-10/mês
.NET Backend:            Mantém custo atual
─────────────────────────────────────────────────
TOTAL:                   $20-30/mês
(Mas com limitações de WebSocket e timeout)
```

### Opção 3 (AWS)

```
ECS Fargate (Next.js):   $30-50/mês
ECS Fargate (NestJS):    $30-50/mês
ElastiCache (Redis):     $15-30/mês
Load Balancer:           $20/mês
.NET Backend:            Mantém custo atual
─────────────────────────────────────────────────
TOTAL:                   $95-150/mês
```

## Monitoramento

### Vercel (Frontend)

- Analytics integrado
- Logs em tempo real
- Performance metrics

### Railway (BFF)

- Logs em tempo real
- Métricas de CPU/RAM
- Uptime monitoring
- Alertas por email

### Ferramentas Adicionais (Opcionais)

```yaml
Sentry:
  - Error tracking
  - Performance monitoring
  - $0-26/mês

LogRocket:
  - Session replay
  - Frontend monitoring
  - $0-99/mês

DataDog:
  - APM completo
  - Logs centralizados
  - $15-31/host/mês
```

## Resumo da Decisão

### ✅ RECOMENDADO: Opção 1

```
Frontend:  Vercel (otimizado para Next.js)
BFF:       Railway (WebSockets + Redis incluído)
Backend:   Mantém onde está

Custo:     $5-40/mês
Setup:     Simples
Features:  Completas (WebSocket, Cache, etc)
```

### ⚠️ Alternativa: Opção 2

```
Frontend + BFF: Vercel (monorepo)

Custo:     $20-30/mês
Setup:     Mais simples
Features:  Limitadas (sem WebSocket nativo)
```

### 💰 Enterprise: Opção 3

```
Tudo:      AWS/Azure

Custo:     $95-150/mês
Setup:     Complexo
Features:  Máximo controle
```

---

**Minha recomendação: Opção 1 com Railway para o BFF!**

Quer que eu crie os arquivos de configuração para deploy no Railway + Vercel?
