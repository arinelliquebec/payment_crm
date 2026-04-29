# Solução para Erro de Sessões Ativas

## 🔧 Problema Identificado

O erro `"Erro ao buscar sessões ativas"` ocorre quando o sistema de permissões tenta acessar endpoints que requerem autenticação, mas a sessão do usuário não está válida ou não existe.

## ✅ Soluções Implementadas

### 1. **Integração com ApiClient**
- ✅ Substituído `fetch` direto pelo `apiClient` existente
- ✅ Utilização dos headers de autenticação já configurados
- ✅ Tratamento de erros consistente com o resto da aplicação

### 2. **Tratamento Robusto de Erros**
- ✅ Detecção automática de erros relacionados a permissões/sessão
- ✅ Fallback para permissões vazias quando há erro de sessão
- ✅ Logs informativos em vez de erros que quebram a aplicação

### 3. **Componentes de Error Handling**
- ✅ `PermissionErrorBoundary` para capturar erros de permissões
- ✅ `PermissionErrorWrapper` para uso simples
- ✅ Componentes de loading específicos para permissões

### 4. **Cache Inteligente**
- ✅ Cache de permissões com expiração
- ✅ Invalidação automática em caso de erro
- ✅ Fallback para estado seguro

## 🚀 Como Usar

### 1. **Envolver Componentes com Error Boundary**

```tsx
import { PermissionErrorWrapper } from '@/components/permissions';

function MyComponent() {
  return (
    <PermissionErrorWrapper>
      <PermissionButton modulo="Cliente" acao="Incluir">
        Novo Cliente
      </PermissionButton>
    </PermissionErrorWrapper>
  );
}
```

### 2. **Usar Componentes de Loading**

```tsx
import { PermissionLoading, UserStatusLoading } from '@/components/permissions';

// Loading genérico
<PermissionLoading message="Carregando permissões..." />

// Loading para status do usuário
<UserStatusLoading />
```

### 3. **Verificar Permissões com Tratamento de Erro**

```tsx
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { hasPermission, permissoes } = useAuth();

  // Verificação segura
  const canCreate = hasPermission('Cliente', 'Incluir');

  if (permissoes?.semPermissao) {
    return <div>Usuário sem permissões</div>;
  }

  return (
    <div>
      {canCreate && <button>Criar Cliente</button>}
    </div>
  );
}
```

## 🔍 Diagnóstico de Problemas

### 1. **Verificar Autenticação**
```typescript
// Verificar se o usuário está logado
const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
const user = localStorage.getItem('user');

console.log('Usuário autenticado:', isAuthenticated);
console.log('Dados do usuário:', user);
```

### 2. **Verificar Headers da Requisição**
O `ApiClient` automaticamente adiciona:
- `X-Usuario-Id`: ID do usuário logado
- `Authorization`: Token de autenticação (se disponível)
- `Content-Type`: application/json

### 3. **Verificar Resposta do Backend**
```typescript
// O serviço de permissões agora trata automaticamente:
// - Erros de sessão expirada
// - Erros de permissão negada
// - Erros de conectividade
// - Respostas vazias
```

## 🛠️ Configuração do Backend

### Endpoints Necessários
Certifique-se de que o backend tem os seguintes endpoints implementados:

```
GET /api/Permission/user-status
GET /api/Permission/check-permission/{modulo}/{acao}
GET /api/Permission/user-permissions
GET /api/Permission/can-access/{modulo}/{recordId}
GET /api/Permission/grupos
GET /api/Permission/permissoes
```

### Headers Obrigatórios
O backend deve aceitar e processar:
- `X-Usuario-Id`: ID do usuário
- `Authorization`: Token de autenticação (opcional)

## 📊 Estados de Permissão

### 1. **Usuário Autenticado com Permissões**
```json
{
  "usuarioId": 1,
  "nome": "João Silva",
  "login": "joao.silva",
  "grupo": "Administrador",
  "filial": "São Paulo",
  "semPermissao": false,
  "permissoes": ["Cliente_Visualizar", "Cliente_Incluir", ...]
}
```

### 2. **Usuário sem Permissões**
```json
{
  "usuarioId": 0,
  "nome": "Usuário não autenticado",
  "login": "guest",
  "grupo": "Usuario",
  "semPermissao": true,
  "mensagem": "Usuário não autenticado ou sessão expirada",
  "permissoes": []
}
```

### 3. **Erro de Sessão**
```json
{
  "usuarioId": 0,
  "nome": "Erro ao carregar",
  "login": "error",
  "grupo": "Usuario",
  "semPermissao": true,
  "mensagem": "Erro ao carregar permissões",
  "permissoes": []
}
```

## 🔄 Fluxo de Recuperação

### 1. **Detecção Automática**
- Sistema detecta erro de sessão/permissão
- Retorna permissões vazias automaticamente
- Log de warning em vez de error

### 2. **Fallback Seguro**
- Componentes mostram estado "sem permissão"
- Aplicação continua funcionando
- Usuário pode tentar fazer login novamente

### 3. **Recuperação Manual**
```typescript
// Invalidar cache e recarregar permissões
const { refreshPermissions } = useAuth();
await refreshPermissions();
```

## 🎯 Benefícios da Solução

### 1. **Robustez**
- ✅ Aplicação não quebra com erros de sessão
- ✅ Fallbacks seguros para todos os cenários
- ✅ Tratamento consistente de erros

### 2. **Experiência do Usuário**
- ✅ Loading states informativos
- ✅ Mensagens de erro claras
- ✅ Possibilidade de retry

### 3. **Manutenibilidade**
- ✅ Código centralizado para tratamento de erros
- ✅ Componentes reutilizáveis
- ✅ Logs informativos para debugging

## 🚨 Troubleshooting

### Erro Persiste?
1. Verificar se o backend está rodando
2. Verificar se os endpoints de permissão existem
3. Verificar se o usuário está autenticado
4. Verificar logs do console para mais detalhes

### Permissões Não Carregam?
1. Verificar cache do localStorage
2. Tentar invalidar cache: `permissionService.invalidateCache()`
3. Verificar se o usuário tem grupo de acesso atribuído

### Componentes Não Funcionam?
1. Verificar se está usando `PermissionErrorWrapper`
2. Verificar se os imports estão corretos
3. Verificar se o `AuthProvider` está configurado

---

**Sistema de permissões agora é robusto e não quebra com erros de sessão!** 🎉
