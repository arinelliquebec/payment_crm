# Environment Setup Guide - Frontend Next.js

## Overview

Este guia explica como configurar as variáveis de ambiente para o frontend Next.js do CRM Arrighi.

## Quick Start

### Para Desenvolvimento Local

1. Copie o arquivo de exemplo:
   ```bash
   cp .env.example .env.local
   ```

2. Edite `.env.local` com suas configurações:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5101/api
   NEXT_PUBLIC_ENVIRONMENT=development
   ```

3. Inicie o servidor de desenvolvimento:
   ```bash
   pnpm dev
   ```

### Para Produção

1. Copie o arquivo de exemplo de produção:
   ```bash
   cp env.production.example .env.production
   ```

2. Edite `.env.production` com a URL do seu backend:
   ```env
   NEXT_PUBLIC_API_URL=https://seu-backend-url.com/api
   NEXT_PUBLIC_ENVIRONMENT=production
   ```

3. Build para produção:
   ```bash
   pnpm build
   ```

## Variáveis de Ambiente

### Obrigatórias

#### `NEXT_PUBLIC_API_URL`
URL do backend da API.

**Desenvolvimento:**
```env
NEXT_PUBLIC_API_URL=http://localhost:5101/api
```

**Produção (Vercel com proxy):**
```env
NEXT_PUBLIC_API_URL=/api/proxy
```

**Produção (URL direta):**
```env
NEXT_PUBLIC_API_URL=https://arrighi-bk-bzfmgxavaxbyh5ej.brazilsouth-01.azurewebsites.net/api
```

#### `NEXT_PUBLIC_ENVIRONMENT`
Ambiente da aplicação.

Valores possíveis: `development`, `production`, `staging`

```env
NEXT_PUBLIC_ENVIRONMENT=development
```

### Opcionais

#### `NEXT_PUBLIC_APP_NAME`
Nome da aplicação (usado em títulos, etc).

```env
NEXT_PUBLIC_APP_NAME=Arrighi CRM
```

#### `NEXT_PUBLIC_APP_VERSION`
Versão da aplicação.

```env
NEXT_PUBLIC_APP_VERSION=1.0.0
```

#### `NEXT_PUBLIC_DEBUG`
Ativa modo debug (apenas desenvolvimento).

```env
NEXT_PUBLIC_DEBUG=true
```

## Hierarquia de Arquivos .env

Next.js carrega variáveis de ambiente na seguinte ordem (do mais específico para o mais geral):

1. `.env.$(NODE_ENV).local` (ex: `.env.production.local`, `.env.development.local`)
2. `.env.local` (não carregado quando `NODE_ENV=test`)
3. `.env.$(NODE_ENV)` (ex: `.env.production`, `.env.development`)
4. `.env`

**Recomendação:**
- Use `.env.local` para desenvolvimento local (não commitado)
- Use `.env.production` para configurações de produção (pode ser commitado sem dados sensíveis)
- Use `.env.example` como template (commitado)

## Variáveis Públicas vs Privadas

### Variáveis Públicas (NEXT_PUBLIC_*)

Variáveis que começam com `NEXT_PUBLIC_` são expostas no browser:

```env
NEXT_PUBLIC_API_URL=http://localhost:5101/api
```

Podem ser acessadas no código:
```typescript
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
```

### Variáveis Privadas (Server-side only)

Variáveis sem o prefixo `NEXT_PUBLIC_` são apenas server-side:

```env
DATABASE_URL=postgresql://...
SECRET_KEY=abc123
```

**⚠️ IMPORTANTE:** Nunca coloque dados sensíveis em variáveis `NEXT_PUBLIC_*` pois elas são expostas no browser!

## Configuração por Ambiente

### Development

Arquivo: `.env.local` ou `.env.development.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5101/api
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_DEBUG=true
```

### Staging (opcional)

Arquivo: `.env.staging`

```env
NEXT_PUBLIC_API_URL=https://staging-api.arrighicrm.com/api
NEXT_PUBLIC_ENVIRONMENT=staging
```

### Production

Arquivo: `.env.production`

```env
NEXT_PUBLIC_API_URL=/api/proxy
NEXT_PUBLIC_ENVIRONMENT=production
```

## Deploy na Vercel

### Opção 1: Via Dashboard

1. Acesse seu projeto na Vercel
2. Vá em **Settings** → **Environment Variables**
3. Adicione as variáveis:
   - `NEXT_PUBLIC_API_URL` = `/api/proxy` ou URL direta
   - `NEXT_PUBLIC_ENVIRONMENT` = `production`

### Opção 2: Via CLI

```bash
vercel env add NEXT_PUBLIC_API_URL production
# Digite o valor quando solicitado
```

### Opção 3: Via vercel.json

Já configurado no arquivo `vercel.json`:

```json
{
  "env": {
    "NEXT_PUBLIC_API_URL": "/api/proxy",
    "NEXT_PUBLIC_ENVIRONMENT": "production"
  }
}
```

## Proxy API (Recomendado para Produção)

Para evitar problemas de CORS, use o proxy do Next.js:

1. Configure a variável:
   ```env
   NEXT_PUBLIC_API_URL=/api/proxy
   ```

2. O Next.js irá rotear `/api/proxy/*` para o backend real

3. Configuração em `vercel.json`:
   ```json
   {
     "rewrites": [
       {
         "source": "/api/proxy/:path*",
         "destination": "https://seu-backend.azurewebsites.net/api/:path*"
       }
     ]
   }
   ```

## Troubleshooting

### Variável não está sendo carregada

1. **Reinicie o servidor de desenvolvimento** após alterar `.env`:
   ```bash
   pnpm dev
   ```

2. **Verifique o prefixo**: Variáveis client-side precisam de `NEXT_PUBLIC_`

3. **Verifique o nome do arquivo**: Deve ser `.env.local` (com ponto no início)

4. **Limpe o cache do Next.js**:
   ```bash
   rm -rf .next
   pnpm dev
   ```

### Erro de CORS

Se estiver tendo problemas de CORS:

1. Use o proxy do Next.js (`NEXT_PUBLIC_API_URL=/api/proxy`)
2. Configure CORS no backend para aceitar seu domínio
3. Verifique se a URL do backend está correta

### API URL incorreta

Para debugar qual URL está sendo usada:

```typescript
import { getApiUrl } from '../env.config';

console.log('API URL:', getApiUrl());
```

## Segurança

### ✅ Boas Práticas

- Nunca commite arquivos `.env.local` ou `.env.*.local`
- Use `.env.example` como template (sem dados sensíveis)
- Variáveis sensíveis devem ser server-side only (sem `NEXT_PUBLIC_`)
- Use diferentes credenciais para cada ambiente

### ❌ Evite

- Colocar senhas ou tokens em variáveis `NEXT_PUBLIC_*`
- Commitar arquivos `.env` com dados reais
- Usar mesmas credenciais em dev e prod

## Recursos Adicionais

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
