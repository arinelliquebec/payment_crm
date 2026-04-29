# Guia Completo: Monorepo Nx + Deploy Azure

## ✅ Arquitetura Correta

### Desenvolvimento (Monorepo Nx)

```
arrighi-crm/                    # UM ÚNICO REPOSITÓRIO
├── apps/
│   ├── frontend/               # Next.js
│   │   └── localhost:3000
│   └── bff/                    # NestJS
│       └── localhost:4000
├── libs/
│   ├── shared/                 # Types compartilhados
│   └── backend-client/         # Cliente HTTP
├── nx.json
└── package.json

# Desenvolvimento local:
npm run dev:all  # Roda Next.js + NestJS juntos
```

### Produção (Deploy Separado)

```
┌─────────────────────────────────────────────────────────────┐
│                    AZURE (Sua Nuvem)                         │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  App Service 1: Next.js Frontend                       │ │
│  │  URL: https://arrighi.azurewebsites.net                │ │
│  │  ou: https://arrighi.com (custom domain)               │ │
│  └────────────────────────────────────────────────────────┘ │
│                           │                                  │
│                           │ HTTPS                            │
│                           ▼                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  App Service 2: NestJS BFF                             │ │
│  │  URL: https://arrighi-api.azurewebsites.net            │ │
│  │  ou: https://api.arrighi.com (custom domain)           │ │
│  └────────────────────────────────────────────────────────┘ │
│                           │                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Azure Cache for Redis                                 │ │
│  │  - Cache de dados                                      │ │
│  │  - Sessões                                             │ │
│  └────────────────────────────────────────────────────────┘ │
│                           │                                  │
│                           │ HTTPS                            │
│                           ▼                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  App Service 3: .NET 10 Backend                        │ │
│  │  URL: https://arrighi-backend.azurewebsites.net        │ │
│  │  (privado - só BFF acessa)                             │ │
│  └────────────────────────────────────────────────────────┘ │
│                           │                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Azure SQL Database                                    │ │
│  │  - Banco de dados                                      │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

## Passo 1: Criar Monorepo Nx

### 1.1 Criar Workspace Nx

```bash
# Criar workspace vazio
npx create-nx-workspace@latest arrighi-crm --preset=empty

cd arrighi-crm

# Instalar plugins
npm install -D @nx/next @nx/nest @nx/js

# Instalar dependências
npm install @nestjs/common @nestjs/core @nestjs/platform-express
npm install @nestjs/config @nestjs/jwt @nestjs/passport
npm install @nestjs/websockets @nestjs/platform-socket.io
npm install @nestjs/cache-manager cache-manager cache-manager-redis-store
npm install @nestjs/throttler
npm install passport passport-jwt
npm install redis socket.io
npm install axios

npm install -D @types/passport-jwt
```

### 1.2 Criar Aplicações

```bash
# Criar frontend Next.js
nx g @nx/next:app frontend --directory=apps/frontend

# Criar BFF NestJS
nx g @nx/nest:app bff --directory=apps/bff

# Criar biblioteca compartilhada
nx g @nx/js:lib shared --directory=libs/shared

# Criar biblioteca de cliente backend
nx g @nx/js:lib backend-client --directory=libs/backend-client
```

### 1.3 Estrutura Final

```
arrighi-crm/
├── apps/
│   ├── frontend/                    # Next.js 16
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── lib/
│   │   │   └── ...
│   │   ├── public/
│   │   ├── next.config.ts
│   │   ├── tsconfig.json
│   │   └── project.json
│   │
│   └── bff/                         # NestJS
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   ├── clientes/
│       │   │   ├── contratos/
│       │   │   └── ...
│       │   └── common/
│       ├── tsconfig.json
│       └── project.json
│
├── libs/
│   ├── shared/                      # Types compartilhados
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   ├── types/
│   │   │   │   │   ├── cliente.types.ts
│   │   │   │   │   ├── contrato.types.ts
│   │   │   │   │   └── usuario.types.ts
│   │   │   │   ├── dtos/
│   │   │   │   └── constants/
│   │   │   └── index.ts
│   │   └── tsconfig.json
│   │
│   └── backend-client/              # Cliente HTTP para .NET
│       ├── src/
│       │   ├── lib/
│       │   │   ├── backend-client.service.ts
│       │   │   └── backend-client.module.ts
│       │   └── index.ts
│       └── tsconfig.json
│
├── nx.json                          # Configuração Nx
├── package.json                     # Dependências compartilhadas
├── tsconfig.base.json              # TypeScript base
├── .gitignore
└── README.md
```

## Passo 2: Configurar Scripts de Desenvolvimento

### package.json (raiz)

```json
{
  "name": "arrighi-crm",
  "version": "1.0.0",
  "scripts": {
    "dev": "nx run-many --target=serve --projects=frontend,bff --parallel=2",
    "dev:frontend": "nx serve frontend",
    "dev:bff": "nx serve bff",
    "build": "nx run-many --target=build --projects=frontend,bff --parallel=2",
    "build:frontend": "nx build frontend --prod",
    "build:bff": "nx build bff --prod",
    "test": "nx run-many --target=test --all",
    "lint": "nx run-many --target=lint --all",
    "start:frontend": "nx serve frontend --prod",
    "start:bff": "node dist/apps/bff/main.js"
  }
}
```

### nx.json

```json
{
  "targetDefaults": {
    "build": {
      "cache": true
    },
    "lint": {
      "cache": true
    },
    "test": {
      "cache": true
    }
  },
  "defaultProject": "frontend",
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx/tasks-runners/default",
      "options": {
        "cacheableOperations": ["build", "lint", "test"]
      }
    }
  }
}
```

### Desenvolvimento Local

```bash
# Rodar tudo junto (recomendado)
npm run dev

# Ou separado
npm run dev:frontend  # localhost:3000
npm run dev:bff       # localhost:4000
```

## Passo 3: Configurar Variáveis de Ambiente

### .env.development (raiz)

```bash
# Frontend
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_WS_URL=ws://localhost:4000

# BFF
PORT=4000
NODE_ENV=development
BACKEND_API_URL=http://localhost:5000/api
JWT_SECRET=dev-secret-change-in-production
REDIS_HOST=localhost
REDIS_PORT=6379
```

### .env.production (raiz)

```bash
# Frontend
NEXT_PUBLIC_API_URL=https://arrighi-api.azurewebsites.net/api
NEXT_PUBLIC_WS_URL=wss://arrighi-api.azurewebsites.net

# BFF
PORT=8080
NODE_ENV=production
BACKEND_API_URL=https://arrighi-backend.azurewebsites.net/api
JWT_SECRET=${JWT_SECRET}  # Configurado no Azure
REDIS_HOST=${REDIS_HOST}  # Configurado no Azure
REDIS_PORT=6380
REDIS_PASSWORD=${REDIS_PASSWORD}
```

## Passo 4: Deploy no Azure

### 4.1 Criar Recursos no Azure

```bash
# Login no Azure
az login

# Criar Resource Group
az group create \
  --name arrighi-crm-rg \
  --location brazilsouth

# Criar App Service Plan (compartilhado)
az appservice plan create \
  --name arrighi-plan \
  --resource-group arrighi-crm-rg \
  --sku B1 \
  --is-linux

# Criar App Service para Frontend
az webapp create \
  --name arrighi-frontend \
  --resource-group arrighi-crm-rg \
  --plan arrighi-plan \
  --runtime "NODE:20-lts"

# Criar App Service para BFF
az webapp create \
  --name arrighi-bff \
  --resource-group arrighi-crm-rg \
  --plan arrighi-plan \
  --runtime "NODE:20-lts"

# Criar Redis Cache
az redis create \
  --name arrighi-redis \
  --resource-group arrighi-crm-rg \
  --location brazilsouth \
  --sku Basic \
  --vm-size c0

# Obter connection string do Redis
az redis list-keys \
  --name arrighi-redis \
  --resource-group arrighi-crm-rg
```

### 4.2 Configurar Variáveis de Ambiente no Azure

```bash
# Frontend
az webapp config appsettings set \
  --name arrighi-frontend \
  --resource-group arrighi-crm-rg \
  --settings \
    NEXT_PUBLIC_API_URL="https://arrighi-bff.azurewebsites.net/api" \
    NEXT_PUBLIC_WS_URL="wss://arrighi-bff.azurewebsites.net"

# BFF
az webapp config appsettings set \
  --name arrighi-bff \
  --resource-group arrighi-crm-rg \
  --settings \
    PORT="8080" \
    NODE_ENV="production" \
    BACKEND_API_URL="https://arrighi-backend.azurewebsites.net/api" \
    JWT_SECRET="seu-secret-super-seguro-aqui" \
    REDIS_HOST="arrighi-redis.redis.cache.windows.net" \
    REDIS_PORT="6380" \
    REDIS_PASSWORD="sua-redis-password-aqui" \
    WEBSITES_PORT="8080"
```

### 4.3 Configurar Deploy Automático (GitHub Actions)

#### .github/workflows/deploy-frontend.yml

```yaml
name: Deploy Frontend to Azure

on:
  push:
    branches: [main]
    paths:
      - "apps/frontend/**"
      - "libs/**"

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build Frontend
        run: npx nx build frontend --prod
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}
          NEXT_PUBLIC_WS_URL: ${{ secrets.NEXT_PUBLIC_WS_URL }}

      - name: Deploy to Azure Web App
        uses: azure/webapps-deploy@v2
        with:
          app-name: "arrighi-frontend"
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE_FRONTEND }}
          package: ./dist/apps/frontend
```

#### .github/workflows/deploy-bff.yml

```yaml
name: Deploy BFF to Azure

on:
  push:
    branches: [main]
    paths:
      - "apps/bff/**"
      - "libs/**"

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build BFF
        run: npx nx build bff --prod

      - name: Create package.json for production
        run: |
          cd dist/apps/bff
          cat > package.json << EOF
          {
            "name": "arrighi-bff",
            "version": "1.0.0",
            "main": "main.js",
            "scripts": {
              "start": "node main.js"
            },
            "dependencies": {
              "@nestjs/common": "^10.0.0",
              "@nestjs/core": "^10.0.0",
              "@nestjs/platform-express": "^10.0.0",
              "reflect-metadata": "^0.1.13",
              "rxjs": "^7.8.1"
            }
          }
          EOF

      - name: Deploy to Azure Web App
        uses: azure/webapps-deploy@v2
        with:
          app-name: "arrighi-bff"
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE_BFF }}
          package: ./dist/apps/bff
```

### 4.4 Configurar Web.config para Azure (se necessário)

#### apps/bff/web.config

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="main.js" verb="*" modules="iisnode"/>
    </handlers>
    <rewrite>
      <rules>
        <rule name="NodeInspector" patternSyntax="ECMAScript" stopProcessing="true">
          <match url="^main.js\/debug[\/]?" />
        </rule>
        <rule name="StaticContent">
          <action type="Rewrite" url="public{REQUEST_URI}"/>
        </rule>
        <rule name="DynamicContent">
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="True"/>
          </conditions>
          <action type="Rewrite" url="main.js"/>
        </rule>
      </rules>
    </rewrite>
    <security>
      <requestFiltering>
        <hiddenSegments>
          <remove segment="bin"/>
        </hiddenSegments>
      </requestFiltering>
    </security>
    <httpErrors existingResponse="PassThrough" />
  </system.webServer>
</configuration>
```

## Passo 5: Configurar CORS no Backend .NET

### appsettings.Production.json

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=..."
  },
  "Cors": {
    "AllowedOrigins": [
      "https://arrighi-bff.azurewebsites.net",
      "https://api.arrighi.com"
    ]
  },
  "Jwt": {
    "Secret": "mesmo-secret-do-bff",
    "Issuer": "ArrighiCRM",
    "Audience": "ArrighiCRM"
  }
}
```

## Custos Estimados Azure

```
App Service Plan B1:           R$ 50/mês
  - Frontend (Next.js)
  - BFF (NestJS)
  - Backend (.NET) - se já não tiver

Azure Cache for Redis (Basic): R$ 70/mês

Azure SQL Database (Basic):    R$ 25/mês (se já não tiver)

Bandwidth:                     R$ 10-30/mês

──────────────────────────────────────────
TOTAL:                         R$ 155-175/mês

Ou se já tem .NET + SQL:       R$ 120/mês
```

### Otimização de Custos

```
Opção 1 - Desenvolvimento:
  App Service Plan Free:       R$ 0
  (Limitado, mas funciona para testes)

Opção 2 - Produção Básica:
  App Service Plan B1:         R$ 50/mês
  Redis Basic C0:              R$ 70/mês
  ──────────────────────────────────────
  TOTAL:                       R$ 120/mês

Opção 3 - Produção Escalável:
  App Service Plan S1:         R$ 100/mês
  Redis Standard C1:           R$ 140/mês
  ──────────────────────────────────────
  TOTAL:                       R$ 240/mês
```

## Comandos Úteis

### Desenvolvimento

```bash
# Rodar tudo
npm run dev

# Rodar apenas frontend
npm run dev:frontend

# Rodar apenas BFF
npm run dev:bff

# Build tudo
npm run build

# Testes
npm test

# Lint
npm run lint
```

### Deploy Manual (se não usar GitHub Actions)

```bash
# Build para produção
npm run build

# Deploy Frontend
cd dist/apps/frontend
az webapp up \
  --name arrighi-frontend \
  --resource-group arrighi-crm-rg

# Deploy BFF
cd dist/apps/bff
az webapp up \
  --name arrighi-bff \
  --resource-group arrighi-crm-rg
```

## Resumo

### ✅ Desenvolvimento

```
Monorepo Nx:
  - apps/frontend (Next.js)
  - apps/bff (NestJS)
  - libs/shared (types)

Comando: npm run dev
Portas: 3000 (frontend) + 4000 (bff)
```

### ✅ Produção

```
Azure App Services:
  - arrighi-frontend.azurewebsites.net
  - arrighi-bff.azurewebsites.net
  - arrighi-backend.azurewebsites.net (já existe)

Azure Redis Cache:
  - Cache de dados
  - Sessões

Deploy: GitHub Actions (automático)
```

### ✅ Fluxo

```
1. Desenvolve no monorepo (tudo junto)
2. Commit no GitHub
3. GitHub Actions faz build separado
4. Deploy automático no Azure
5. Frontend e BFF em App Services separados
```

---

**Quer que eu crie os arquivos de configuração do monorepo Nx agora?**
