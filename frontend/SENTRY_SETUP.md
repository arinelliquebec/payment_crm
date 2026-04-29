# 🛡️ Configuração do Sentry - CRM Arrighi Frontend

## Visão Geral

O Sentry está configurado para capturar:
- ✅ Erros de JavaScript/TypeScript
- ✅ Erros de React (Error Boundaries)
- ✅ Performance (Web Vitals)
- ✅ Session Replay (gravação de sessões com erro)
- ✅ Source Maps (stack traces legíveis)

---

## 🚀 Passo a Passo para Ativar

### 1. Criar Conta no Sentry (Gratuito)

1. Acesse [https://sentry.io/signup/](https://sentry.io/signup/)
2. Crie uma conta (pode usar GitHub/Google)
3. O plano **Developer (gratuito)** inclui:
   - 5.000 erros/mês
   - 1GB de attachments
   - 50 replays/mês
   - Retenção de 30 dias

### 2. Criar Projeto Next.js

1. No Sentry, vá em **Projects** → **Create Project**
2. Selecione **Next.js**
3. Nome: `crm-arrighi-frontend`
4. Copie a **DSN** gerada

### 3. Configurar Variáveis de Ambiente

#### Desenvolvimento Local (.env.local)

```bash
# Criar arquivo .env.local no frontend/
cat > .env.local << 'EOF'
# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ORG=sua-organizacao
SENTRY_PROJECT=crm-arrighi-frontend
EOF
```

#### Produção (Vercel)

No painel da Vercel:
1. Settings → Environment Variables
2. Adicione:

| Variável | Valor |
|----------|-------|
| `NEXT_PUBLIC_SENTRY_DSN` | Sua DSN do Sentry |
| `SENTRY_ORG` | Nome da sua organização |
| `SENTRY_PROJECT` | `crm-arrighi-frontend` |
| `SENTRY_AUTH_TOKEN` | Token de autenticação |

### 4. Gerar Auth Token (Para Source Maps)

1. Acesse [https://sentry.io/settings/auth-tokens/](https://sentry.io/settings/auth-tokens/)
2. Clique em **Create New Token**
3. Permissões necessárias:
   - `project:releases`
   - `org:read`
4. Copie o token

---

## 📊 O que o Sentry Captura

### Erros Automáticos

```typescript
// Qualquer erro não tratado é capturado automaticamente
throw new Error("Algo deu errado!");

// Erros em componentes React
const Component = () => {
  // Se isso falhar, Sentry captura
  const data = JSON.parse(invalidJson);
  return <div>{data}</div>;
};
```

### Erros Manuais

```typescript
import * as Sentry from "@sentry/nextjs";

// Capturar erro manualmente
try {
  await riskyOperation();
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      feature: "boletos",
      clienteId: "123"
    },
    extra: {
      payload: requestData
    }
  });
}

// Capturar mensagem
Sentry.captureMessage("Usuário tentou ação não permitida", {
  level: "warning",
  tags: { userId: user.id }
});
```

### Contexto do Usuário

```typescript
// Adicionar contexto do usuário (já configurado no AuthContext)
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.nome
});

// Adicionar breadcrumb (rastro de ações)
Sentry.addBreadcrumb({
  category: "navigation",
  message: "Usuário acessou página de boletos",
  level: "info"
});
```

---

## 🔧 Configuração Atual

### sentry.client.config.ts

```typescript
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,           // 100% das transações
  replaysSessionSampleRate: 0.1,   // 10% das sessões normais
  replaysOnErrorSampleRate: 1.0,   // 100% das sessões com erro
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,           // Mascarar textos (LGPD)
      blockAllMedia: true,         // Bloquear mídia
    }),
  ],
});
```

### next.config.ts

```typescript
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  widenClientFileUpload: true,     // Source maps completos
  tunnelRoute: "/monitoring",       // Bypass ad-blockers
  disableLogger: true,              // Remover logs em prod
});
```

---

## 📈 Dashboards Recomendados

### No Sentry, configure alertas para:

1. **Taxa de Erros Alta**
   - Condição: > 10 erros em 5 minutos
   - Ação: Notificar Slack/Email

2. **Erro Crítico em Pagamento**
   - Tag: `feature:boletos` ou `feature:pagamento`
   - Ação: Notificar imediatamente

3. **Performance Degradada**
   - LCP > 4 segundos
   - Ação: Criar issue

---

## 🔗 Integração com Application Insights

O Sentry (frontend) e Application Insights (backend) trabalham juntos:

```
┌─────────────────────────────────────────────────────────────┐
│                     FLUXO DE ERRO                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   1. Usuário clica          2. Frontend faz                │
│      em "Gerar Boleto"         requisição                  │
│           │                        │                        │
│           ▼                        ▼                        │
│   ┌─────────────┐          ┌─────────────┐                 │
│   │   SENTRY    │◄────────►│ APPLICATION │                 │
│   │  (Frontend) │          │  INSIGHTS   │                 │
│   │             │          │  (Backend)  │                 │
│   │ - UI Error  │          │ - API Error │                 │
│   │ - Network   │          │ - DB Error  │                 │
│   │ - JS Error  │          │ - Santander │                 │
│   └─────────────┘          └─────────────┘                 │
│           │                        │                        │
│           └────────────┬───────────┘                        │
│                        ▼                                    │
│              ┌─────────────────┐                           │
│              │  CORRELATION ID │                           │
│              │  (Trace único)  │                           │
│              └─────────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 📚 Referências

- [Documentação Sentry Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Session Replay](https://docs.sentry.io/product/session-replay/)
- [Source Maps](https://docs.sentry.io/platforms/javascript/sourcemaps/)
- [Alertas](https://docs.sentry.io/product/alerts/)

