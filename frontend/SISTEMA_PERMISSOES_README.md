# Sistema de Grupos de Acesso - Frontend

## 📋 Visão Geral

O sistema CRM Arrighi implementa um controle de acesso baseado em grupos e permissões. Cada usuário pertence a um grupo que define suas permissões no sistema.

## 🏗️ Arquitetura Implementada

### Estrutura de Arquivos

```
src/
├── types/
│   └── permissions.ts              # Tipos TypeScript para permissões
├── services/
│   ├── permission.service.ts       # Serviço principal de permissões
│   └── navigation.service.ts       # Serviço de navegação com permissões
├── hooks/
│   └── usePermissions.ts          # Hooks React para permissões
├── components/
│   └── permissions/
│       ├── PermissionWrapper.tsx   # Componentes de controle de acesso
│       ├── UserStatus.tsx          # Status do usuário
│       ├── NavigationMenu.tsx      # Menu de navegação
│       └── index.ts               # Exportações centralizadas
├── contexts/
│   └── AuthContext.tsx            # Contexto de autenticação atualizado
└── examples/
    └── PermissionExamples.tsx     # Exemplos de uso
```

## 🎯 Funcionalidades Implementadas

### 1. **Tipos TypeScript**
- ✅ Interfaces completas para permissões
- ✅ Constantes para módulos e ações
- ✅ Tipos para navegação e cache

### 2. **Serviço de Permissões**
- ✅ Cache inteligente com localStorage
- ✅ Verificação de permissões específicas
- ✅ Métodos de conveniência (CRUD)
- ✅ Verificação de acesso a registros
- ✅ Gerenciamento de grupos e permissões

### 3. **Hooks React**
- ✅ `usePermissions()` - Hook principal
- ✅ `usePermissionCheck()` - Verificações específicas
- ✅ `useCrudPermissions()` - Permissões CRUD
- ✅ `useGruposAcesso()` - Gerenciamento de grupos
- ✅ `useNavigationPermissions()` - Navegação com permissões
- ✅ `useCurrentUser()` - Informações do usuário

### 4. **Componentes de Controle de Acesso**
- ✅ `PermissionWrapper` - Wrapper genérico
- ✅ `PermissionButton` - Botões com permissões
- ✅ `PermissionLink` - Links com permissões
- ✅ `PermissionSection` - Seções com permissões
- ✅ `MultiplePermissionsWrapper` - Múltiplas permissões
- ✅ `UserStatus` - Status do usuário
- ✅ `NavigationMenu` - Menu de navegação

### 5. **Contexto de Autenticação Atualizado**
- ✅ Integração com sistema de permissões
- ✅ Cache de permissões
- ✅ Verificação rápida de permissões
- ✅ Invalidação de cache no logout

## 🚀 Como Usar

### 1. **Importar Componentes**

```typescript
import {
  PermissionWrapper,
  PermissionButton,
  UserStatus,
  NavigationMenu
} from '@/components/permissions';
```

### 2. **Usar Hooks**

```typescript
import { usePermissions, useCrudPermissions } from '@/hooks/usePermissions';

function MyComponent() {
  const { permissoes, loading } = usePermissions();
  const { canView, canCreate, canEdit, canDelete } = useCrudPermissions('Cliente');

  // Usar as permissões...
}
```

### 3. **Usar Contexto de Autenticação**

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { hasPermission, permissoes } = useAuth();

  const canViewUsers = hasPermission('Usuario', 'Visualizar');

  // Usar a permissão...
}
```

### 4. **Exemplos de Uso**

#### Botões com Permissões
```tsx
<PermissionButton
  modulo="Cliente"
  acao="Incluir"
  className="bg-blue-600 text-white px-4 py-2 rounded"
  fallback={<div>Sem permissão</div>}
>
  Novo Cliente
</PermissionButton>
```

#### Seções com Permissões
```tsx
<PermissionSection
  modulo="Usuario"
  acao="Visualizar"
  className="bg-blue-50 p-4 rounded"
  fallback={<div>Você não tem acesso a esta seção</div>}
>
  <h2>Gerenciamento de Usuários</h2>
  {/* Conteúdo da seção */}
</PermissionSection>
```

#### Múltiplas Permissões
```tsx
<MultiplePermissionsWrapper
  permissions={[
    { modulo: 'Cliente', acao: 'Visualizar' },
    { modulo: 'Contrato', acao: 'Visualizar' }
  ]}
  requireAll={false} // OR logic
>
  <div>Conteúdo visível se tiver qualquer uma das permissões</div>
</MultiplePermissionsWrapper>
```

## 🔧 Configuração

### 1. **Variáveis de Ambiente**

```env
NEXT_PUBLIC_API_URL=http://localhost:5101/api
```

### 2. **Configuração do Backend**

O backend deve ter os seguintes endpoints implementados:

- `GET /api/Permission/user-status` - Status do usuário
- `GET /api/Permission/check-permission/{modulo}/{acao}` - Verificar permissão
- `GET /api/Permission/user-permissions` - Permissões do usuário
- `GET /api/Permission/can-access/{modulo}/{recordId}` - Acesso a registro
- `GET /api/Permission/grupos` - Grupos de acesso
- `GET /api/Permission/permissoes` - Permissões disponíveis

### 3. **Integração com Layout**

```tsx
// app/layout.tsx
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

## 📊 Grupos de Acesso Disponíveis

| ID | Nome | Descrição | Permissões |
|---|---|---|---|
| 1 | Usuario | Usuário sem grupo de acesso | Nenhuma permissão |
| 2 | Administrador | Acesso total ao sistema | Todas as permissões |
| 3 | Consultores | Acesso a pessoa física/jurídica total, clientes da mesma filial | PessoaFisica, PessoaJuridica, Cliente (filial) |
| 4 | Administrativo de Filial | Apenas visualização de consultores, clientes e contratos da sua filial | Consultor, Cliente, Contrato (visualização, filial) |
| 5 | Gestor de Filial | Edita, inclui e exclui em todo o sistema porém somente na sua filial | Todos os módulos exceto Usuario (filial) |
| 6 | Cobrança e Financeiro | Acesso total para visualizar todo o sistema (aba usuários oculta) | Todos os módulos exceto Usuario |
| 7 | Faturamento | Acesso similar ao administrador exceto módulo de usuários | Todos os módulos exceto Usuario |

## 🎨 Módulos do Sistema

- **PessoaFisica**: Gerenciamento de pessoas físicas
- **PessoaJuridica**: Gerenciamento de pessoas jurídicas
- **Cliente**: Gerenciamento de clientes
- **Contrato**: Gerenciamento de contratos
- **Consultor**: Gerenciamento de consultores
- **Usuario**: Gerenciamento de usuários
- **Filial**: Gerenciamento de filiais
- **Parceiro**: Gerenciamento de parceiros
- **Boleto**: Gerenciamento de boletos
- **GrupoAcesso**: Gerenciamento de grupos de acesso

## ⚡ Ações Disponíveis

- **Visualizar**: Apenas visualização dos dados
- **Incluir**: Criar novos registros
- **Editar**: Modificar registros existentes
- **Excluir**: Remover registros

## 🔒 Segurança

### 1. **Cache de Permissões**
- Cache local com expiração de 5 minutos
- Invalidação automática no logout
- Fallback para verificação online

### 2. **Verificações de Segurança**
- **NUNCA** confie apenas nas verificações do frontend
- O backend sempre deve validar as permissões
- Use as verificações do frontend apenas para UX

### 3. **Tratamento de Erros**
- Fallback para estado sem permissão
- Logs de erro para debugging
- Estados de loading para melhor UX

## 🚀 Performance

### 1. **Otimizações Implementadas**
- Cache inteligente de permissões
- Lazy loading de componentes
- Verificações em lote
- Estados de loading

### 2. **Boas Práticas**
- Carregue as permissões uma vez após o login
- Use lazy loading para módulos não acessíveis
- Implemente loading states durante verificações

## 🧪 Testes

### 1. **Testes de Permissão**
```typescript
// Exemplo de teste
describe('PermissionService', () => {
  it('should return true for admin user', async () => {
    const hasPermission = await permissionService.hasPermission('PessoaFisica', 'Visualizar');
    expect(hasPermission).toBe(true);
  });
});
```

### 2. **Testes de Componentes**
```typescript
// Exemplo de teste de componente
describe('PermissionWrapper', () => {
  it('should render children when user has permission', () => {
    // Mock das permissões
    // Renderizar componente
    // Verificar se o conteúdo é exibido
  });
});
```

## 📝 Exemplos Completos

Veja o arquivo `src/examples/PermissionExamples.tsx` para exemplos completos de uso de todos os componentes e hooks implementados.

## 🔄 Atualizações Futuras

### 1. **Funcionalidades Planejadas**
- [ ] Filtros por filial automáticos
- [ ] Situações específicas para consultores
- [ ] Relatórios de permissões
- [ ] Auditoria de acesso

### 2. **Melhorias de Performance**
- [ ] Cache mais inteligente
- [ ] Prefetch de permissões
- [ ] Otimização de re-renders

## 📞 Suporte

Para dúvidas ou problemas com o sistema de permissões:

1. Verifique os logs do console
2. Confirme se o backend está funcionando
3. Verifique as permissões do usuário no banco de dados
4. Consulte os exemplos em `PermissionExamples.tsx`

---

**Sistema implementado com sucesso!** 🎉

O sistema de permissões está totalmente funcional e integrado ao frontend React/Next.js do CRM Arrighi.
