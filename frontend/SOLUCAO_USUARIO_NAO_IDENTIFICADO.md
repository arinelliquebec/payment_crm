# Solução para Erro "Usuário não identificado"

## 🔧 Problema Identificado

O erro `"Usuário não identificado"` ocorre quando o sistema de permissões tenta acessar endpoints que requerem o header `X-Usuario-Id`, mas o ID do usuário não está sendo enviado corretamente ou não está disponível.

## ✅ Soluções Implementadas

### 1. **Melhoria na Identificação do Usuário**
- ✅ Verificação de múltiplas propriedades para o ID do usuário (`id`, `Id`, `usuarioId`, `userId`)
- ✅ Validação de autenticação antes de tentar carregar permissões
- ✅ Logs de debug para identificar problemas de identificação

### 2. **Tratamento Robusto de Erros**
- ✅ Detecção automática de erros de "usuário não identificado"
- ✅ Fallback para permissões vazias quando há erro de identificação
- ✅ Verificação de autenticação antes de fazer requisições

### 3. **Componentes de Debug**
- ✅ `AuthDebug` para diagnosticar problemas de autenticação
- ✅ `AuthStatus` para mostrar status de autenticação
- ✅ `useAuthCheck` hook para verificar autenticação

### 4. **Cache Inteligente**
- ✅ Invalidação de cache quando usuário não está autenticado
- ✅ Verificação de autenticação antes de usar cache

## 🚀 Como Usar

### 1. **Verificar Status de Autenticação**

```tsx
import { AuthStatus, AuthDebug } from '@/components/permissions';

function MyComponent() {
  return (
    <div>
      <AuthStatus />
      {/* Só em desenvolvimento */}
      <AuthDebug />
    </div>
  );
}
```

### 2. **Usar Hook de Verificação de Autenticação**

```tsx
import { useAuthCheck } from '@/hooks/useAuthCheck';

function MyComponent() {
  const { isAuthenticated, userId, userData, isLoading } = useAuthCheck();

  if (isLoading) {
    return <div>Verificando autenticação...</div>;
  }

  if (!isAuthenticated) {
    return <div>Usuário não autenticado</div>;
  }

  if (!userId) {
    return <div>ID do usuário não encontrado</div>;
  }

  return <div>Usuário autenticado: {userId}</div>;
}
```

### 3. **Verificar se Deve Carregar Permissões**

```tsx
import { useShouldLoadPermissions } from '@/hooks/useAuthCheck';

function MyComponent() {
  const shouldLoad = useShouldLoadPermissions();

  if (!shouldLoad) {
    return <div>Não deve carregar permissões</div>;
  }

  return <div>Carregando permissões...</div>;
}
```

## 🔍 Diagnóstico de Problemas

### 1. **Verificar localStorage**
```typescript
// Verificar se o usuário está salvo corretamente
const user = localStorage.getItem('user');
const isAuthenticated = localStorage.getItem('isAuthenticated');

console.log('Usuário:', user);
console.log('Autenticado:', isAuthenticated);

if (user) {
  const userData = JSON.parse(user);
  console.log('ID do usuário:', userData.id || userData.Id || userData.usuarioId);
}
```

### 2. **Verificar Headers da Requisição**
O `ApiClient` agora:
- ✅ Só envia `X-Usuario-Id` se tiver um ID válido
- ✅ Tenta múltiplas propriedades para encontrar o ID
- ✅ Loga informações de debug em desenvolvimento

### 3. **Usar Componente de Debug**
```tsx
// Adicionar em desenvolvimento para diagnosticar
<AuthDebug />
```

## 🛠️ Estrutura do Usuário Esperada

### 1. **Estrutura no localStorage**
```json
{
  "id": 1,
  "usuarioId": 1,
  "login": "usuario@exemplo.com",
  "email": "usuario@exemplo.com",
  "nome": "Nome do Usuário",
  "grupoAcesso": "Administrador",
  "token": "jwt-token-here"
}
```

### 2. **Propriedades de ID Suportadas**
O sistema agora procura por estas propriedades (em ordem):
- `id`
- `Id`
- `usuarioId`
- `userId`

### 3. **Headers Enviados**
```typescript
{
  "Content-Type": "application/json",
  "Accept": "application/json",
  "Authorization": "Bearer jwt-token", // se disponível
  "X-Usuario-Id": "1" // só se ID válido encontrado
}
```

## 📊 Estados de Autenticação

### 1. **Usuário Não Autenticado**
```typescript
{
  isAuthenticated: false,
  userId: null,
  userData: null,
  isLoading: false
}
```

### 2. **Usuário Autenticado sem ID**
```typescript
{
  isAuthenticated: true,
  userId: null,
  userData: { /* dados sem ID */ },
  isLoading: false
}
```

### 3. **Usuário Autenticado com ID**
```typescript
{
  isAuthenticated: true,
  userId: 1,
  userData: { id: 1, /* outros dados */ },
  isLoading: false
}
```

## 🔄 Fluxo de Verificação

### 1. **Verificação de Autenticação**
```typescript
// 1. Verificar se está autenticado
const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

// 2. Se autenticado, verificar dados do usuário
if (isAuthenticated) {
  const user = localStorage.getItem('user');
  const userData = JSON.parse(user);
  const userId = userData.id || userData.Id || userData.usuarioId || userData.userId;

  // 3. Só fazer requisições se tiver ID válido
  if (userId) {
    // Fazer requisição com X-Usuario-Id
  }
}
```

### 2. **Tratamento de Erros**
```typescript
// Se erro de "usuário não identificado"
if (error.includes('usuário não identificado')) {
  // Retornar permissões vazias
  return getEmptyPermissions();
}
```

## 🎯 Benefícios da Solução

### 1. **Robustez**
- ✅ Verificação de autenticação antes de requisições
- ✅ Múltiplas tentativas para encontrar ID do usuário
- ✅ Fallbacks seguros para todos os cenários

### 2. **Debugging**
- ✅ Componentes de debug para identificar problemas
- ✅ Logs informativos em desenvolvimento
- ✅ Status de autenticação visível

### 3. **Experiência do Usuário**
- ✅ Não quebra a aplicação com erros de identificação
- ✅ Estados de loading informativos
- ✅ Mensagens de erro claras

## 🚨 Troubleshooting

### Erro "Usuário não identificado" persiste?
1. Verificar se o usuário está logado: `localStorage.getItem('isAuthenticated')`
2. Verificar dados do usuário: `localStorage.getItem('user')`
3. Verificar se o ID está presente nos dados do usuário
4. Usar `<AuthDebug />` para diagnosticar

### ID do usuário não é encontrado?
1. Verificar estrutura dos dados retornados pelo login
2. Verificar se o backend está retornando o ID correto
3. Verificar se o ID está sendo salvo no localStorage

### Permissões não carregam?
1. Verificar se `useShouldLoadPermissions()` retorna `true`
2. Verificar se o usuário está autenticado
3. Verificar se o ID do usuário é válido

## 🔧 Configuração do Backend

### Endpoints que Requerem X-Usuario-Id
```
GET /api/Permission/user-status
GET /api/Permission/check-permission/{modulo}/{acao}
GET /api/Permission/user-permissions
GET /api/Permission/can-access/{modulo}/{recordId}
```

### Validação no Backend
```csharp
// Verificar se o header X-Usuario-Id está presente
var usuarioIdHeader = Request.Headers["X-Usuario-Id"].FirstOrDefault();
if (!int.TryParse(usuarioIdHeader, out int usuarioId))
{
    return Unauthorized("Usuário não identificado");
}
```

---

**Sistema de identificação de usuário agora é robusto e não quebra com erros de identificação!** 🎉
