# Deploy no Vercel - Configuração Monorepo

## 📋 Arquivos de Configuração Criados

### 1. `/vercel.json` (Raiz do projeto)
```json
{
  "buildCommand": "cd frontend && pnpm install && pnpm build",
  "outputDirectory": "frontend/.next",
  "installCommand": "pnpm install --no-frozen-lockfile",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_API_URL": "https://arrighi-bk-bzfmgxavaxbyh5ej.brazilsouth-01.azurewebsites.net/api"
  }
}
```

### 2. `frontend/next.config.ts` (Atualizado)
```typescript
import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  outputFileTracingRoot: path.join(__dirname, "../"),
};

export default nextConfig;
```

### 3. `frontend/.vercelignore`
```
# Vercel ignore
vercel.json
```

### 4. Arquivos de versão Node.js
- `/.nvmrc` → `20`
- `/.node-version` → `20`

## 🚀 Configuração no Vercel Dashboard

### Passo 1: Configurações do Projeto
- **Framework Preset**: `Next.js`
- **Root Directory**: `frontend`
- **Build Command**: `pnpm run build` (detectado automaticamente)
- **Output Directory**: `.next` (detectado automaticamente)
- **Install Command**: `pnpm install` (detectado automaticamente)

### Passo 2: Variáveis de Ambiente
Adicionar no dashboard do Vercel:

```
NEXT_PUBLIC_API_URL=https://arrighi-bk-bzfmgxavaxbyh5ej.brazilsouth-01.azurewebsites.net/api
NODE_ENV=production
```

### Passo 3: Deploy Settings
- **Node.js Version**: `20.x` (automaticamente detectado pelo .nvmrc)
- **Region**: `São Paulo (gru1)`

## 🔧 Resolução de Problemas

### Problema: "Command failed with exit code 1"
**Solução**: Verificar se o `vercel.json` está no diretório raiz e configurado corretamente.

### Problema: "Failed to compile"
**Solução**: O build local funciona, então verificar as variáveis de ambiente no dashboard do Vercel.

### Problema: Warnings sobre lockfiles
**Solução**: Configuração `outputFileTracingRoot` no `next.config.ts` resolve os warnings.

## ✅ Checklist de Deploy

- [x] `vercel.json` no diretório raiz configurado
- [x] `next.config.ts` atualizado com `outputFileTracingRoot`
- [x] `.vercelignore` criado no frontend
- [x] Arquivos de versão Node.js criados
- [x] Build local funcionando sem erros
- [x] Variáveis de ambiente definidas

## 📝 Notas Importantes

1. **Estrutura Monorepo**: O Vercel agora reconhece corretamente a estrutura do monorepo
2. **Build Otimizado**: Sem warnings sobre múltiplos lockfiles
3. **Performance**: Deploy otimizado para região Brasil (gru1)
4. **Compatibilidade**: Funciona com pnpm e workspaces
