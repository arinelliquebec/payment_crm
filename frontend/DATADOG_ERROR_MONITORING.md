# Monitoramento de Erros com Datadog RUM

Este projeto está configurado com Datadog RUM (Real User Monitoring) para monitorar erros, performance e comportamento dos usuários em produção.

## 📋 Configuração

### 1. Inicialização do Datadog

O Datadog é inicializado automaticamente no `DatadogProvider` localizado em:
```
frontend/src/core/providers/DatadogProvider.tsx
```

**Configurações atuais:**
- **Application ID**: `1a2f1e93-8d48-408b-a5e2-bc4224cf6578`
- **Client Token**: `pub49b8ab6f0ee91f02769e0651e2ea11fe`
- **Site**: `us5.datadoghq.com`
- **Service**: `crm`
- **Environment**: `prod`
- **Session Sample Rate**: 100% (todas as sessões são rastreadas)
- **Session Replay**: 20% das sessões têm replay ativado
- **Privacy Level**: `mask-user-input` (mascara inputs do usuário)

### 2. Integração com Next.js

O provider está integrado no layout principal (`frontend/src/app/layout.tsx`), garantindo que todas as páginas sejam monitoradas.

## 🚨 Tipos de Erros Capturados

### 1. Erros Globais
Capturados automaticamente em `global-error.tsx`:
- Erros não tratados em toda a aplicação
- Erros de renderização do Next.js

### 2. Erros de Componentes React
Capturados pelo `ErrorBoundary`:
- Erros em componentes React
- Erros em lifecycle methods
- Erros em event handlers dentro de componentes

### 3. Erros de JavaScript não tratados
Capturados automaticamente pelo `ErrorTrackingService`:
- `window.onerror`
- `unhandledrejection` (Promises rejeitadas)

### 4. Erros de API
Capturados manualmente quando necessário:
- Erros de requisições HTTP
- Timeouts
- Respostas com status de erro

## 📚 Como Usar

### Capturar Erro Simples

```typescript
import { datadogError } from "@/core/services/datadog-error.service";

try {
  // Seu código
  throw new Error("Algo deu errado");
} catch (error) {
  datadogError.captureError(error);
}
```

### Capturar Erro com Contexto

```typescript
import { datadogError } from "@/core/services/datadog-error.service";

try {
  // Seu código
} catch (error) {
  datadogError.captureError(error, {
    userId: user.id,
    userName: user.nome,
    userEmail: user.email,
    route: "/dashboard",
    action: "load_data",
    metadata: {
      customField: "valor",
      attemptNumber: 3,
    },
  });
}
```

### Capturar Erro de API

```typescript
import { datadogError } from "@/core/services/datadog-error.service";

async function fetchData() {
  try {
    const response = await fetch("/api/data");
    if (!response.ok) {
      throw new Error("API Error");
    }
    return await response.json();
  } catch (error) {
    datadogError.captureApiError(
      "/api/data",
      "GET",
      response?.status || 500,
      error,
      { message: "Falha ao carregar dados" }
    );
    throw error;
  }
}
```

### Capturar Erro de Validação

```typescript
import { datadogError } from "@/core/services/datadog-error.service";

function validateForm(data) {
  if (!data.email) {
    datadogError.captureValidationError(
      "email",
      "Email é obrigatório",
      data
    );
  }
}
```

### Usar ErrorBoundary em Componentes

```typescript
import { ErrorBoundary } from "@/shared/components/feedback/ErrorBoundary";

export function MyComponent() {
  return (
    <ErrorBoundary componentName="MyComponent">
      {/* Componente que pode gerar erros */}
    </ErrorBoundary>
  );
}
```

## 👤 Rastreamento de Usuários

O rastreamento de usuários é automático após o login. O `AuthContext` integra com o Datadog para:

1. **No Login:**
   - Define informações do usuário (ID, nome, email)
   - Adiciona contexto global (grupo de acesso, tipo de pessoa)

2. **No Logout:**
   - Limpa informações do usuário
   - Remove contexto global

3. **Após Recarregar Página:**
   - Restaura informações do usuário do localStorage
   - Reconecta com o Datadog

**Não é necessário código adicional** - isso acontece automaticamente!

## 🔧 Serviços Disponíveis

### DatadogErrorService

Serviço principal para captura de erros.

```typescript
import { datadogError } from "@/core/services/datadog-error.service";

// Capturar erro genérico
datadogError.captureError(error, context?);

// Capturar erro de API
datadogError.captureApiError(endpoint, method, statusCode, error, responseData?);

// Capturar erro de validação
datadogError.captureValidationError(field, message, data?);

// Capturar erro de autenticação
datadogError.captureAuthError(message, userId?);

// Capturar erro de componente React
datadogError.captureComponentError(error, componentName, componentStack?);

// Definir usuário
datadogError.setUser(userId, userName?, userEmail?);

// Limpar usuário
datadogError.clearUser();

// Adicionar contexto global
datadogError.addGlobalContext(key, value);

// Remover contexto global
datadogError.removeGlobalContext(key);
```

### ErrorTrackingService

Serviço legado que agora integra com Datadog automaticamente.

```typescript
import { errorTracking } from "@/core/services/error-tracking.service";

// Capturar erro (envia para Datadog automaticamente)
errorTracking.captureError(error, context?);

// Capturar erro de API
errorTracking.captureApiError(endpoint, method, statusCode, error);

// Capturar erro de validação
errorTracking.captureValidationError(field, message, data?);
```

## 📊 Visualizando Erros no Datadog

1. Acesse: https://us5.datadoghq.com
2. Navegue para **RUM** → **Error Tracking**
3. Filtre por:
   - **Service**: `crm`
   - **Environment**: `prod`
   - **User ID**, **Route**, **Error Type**, etc.

### Informações Disponíveis

Para cada erro, você terá acesso a:
- Stack trace completo
- Informações do usuário (ID, nome, email)
- Rota onde o erro ocorreu
- Ação que causou o erro
- Contexto adicional (metadata)
- Session replay (20% das sessões)
- Device e browser info
- Timestamp e frequência

## 🔍 Exemplos Completos

Veja exemplos detalhados em:
```
frontend/src/examples/DatadogErrorExamples.tsx
```

## 🎯 Melhores Práticas

### 1. Sempre adicione contexto relevante
```typescript
datadogError.captureError(error, {
  route: pathname,
  action: "specific_action",
  metadata: {
    // Informações úteis para debug
  },
});
```

### 2. Use ErrorBoundary em componentes críticos
```typescript
<ErrorBoundary componentName="CriticalFeature">
  <CriticalFeature />
</ErrorBoundary>
```

### 3. Capture erros de API com informações completas
```typescript
datadogError.captureApiError(
  endpoint,
  method,
  statusCode,
  error,
  responseData // Útil para debug
);
```

### 4. Não capture dados sensíveis
```typescript
// ❌ NÃO FAÇA ISSO
datadogError.captureError(error, {
  metadata: {
    password: userPassword,
    creditCard: cardNumber,
  }
});

// ✅ FAÇA ISSO
datadogError.captureError(error, {
  metadata: {
    hasPassword: !!userPassword,
    cardType: cardType,
  }
});
```

### 5. Use privacy level adequado
O projeto está configurado com `mask-user-input` para mascarar automaticamente inputs sensíveis nos session replays.

## 🚀 Performance

O Datadog RUM é otimizado para não impactar a performance:
- Carregamento assíncrono
- Batching de eventos
- Amostragem configurável
- Mínimo overhead

## 🔒 Segurança e Privacidade

- Inputs do usuário são mascarados automaticamente
- Tokens e senhas não devem ser enviados no contexto
- Session replay está limitado a 20% das sessões
- Dados são armazenados em servidores Datadog (US5)

## 📝 Notas

- O Datadog só é inicializado no cliente (browser)
- Erros em Server Components do Next.js 16 não são capturados automaticamente
- Para monitorar APIs do backend, configure o Datadog no servidor .NET

## 🆘 Troubleshooting

### Erros não aparecem no Datadog

1. Verifique se o Datadog foi inicializado:
```typescript
import { datadogRum } from "@datadog/browser-rum";
console.log(datadogRum.getInitConfiguration());
```

2. Verifique as credenciais no `DatadogProvider`

3. Verifique se há bloqueadores de ad/tracking no browser

4. Verifique a console do browser por erros do Datadog

### Session Replay não funciona

- Apenas 20% das sessões têm replay
- Verifique se a feature está habilitada na sua conta Datadog
- Aumente `sessionReplaySampleRate` para 100% para testar

## 📚 Recursos Adicionais

- [Documentação Datadog RUM](https://docs.datadoghq.com/real_user_monitoring/)
- [Datadog React Integration](https://docs.datadoghq.com/real_user_monitoring/browser/modifying_data_and_context/?tab=npm)
- [Error Tracking](https://docs.datadoghq.com/real_user_monitoring/error_tracking/)
- [Session Replay](https://docs.datadoghq.com/real_user_monitoring/session_replay/)



