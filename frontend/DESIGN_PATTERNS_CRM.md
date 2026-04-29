# Design Patterns e Best Practices para CRM

## Arquitetura Recomendada

### 1. **Feature-Based Architecture** (Recomendado para CRMs)

```
src/
├── features/              # Módulos por funcionalidade
│   ├── clientes/
│   │   ├── components/   # Componentes específicos
│   │   ├── hooks/        # Hooks customizados
│   │   ├── services/     # Lógica de negócio
│   │   ├── types/        # TypeScript types
│   │   └── utils/        # Utilitários
│   ├── contratos/
│   ├── dashboard/
│   └── usuarios/
├── shared/               # Código compartilhado
│   ├── components/       # Componentes reutilizáveis
│   ├── hooks/           # Hooks globais
│   ├── services/        # Serviços globais
│   ├── types/           # Types globais
│   └── utils/           # Utilitários globais
├── core/                # Configurações core
│   ├── api/            # Cliente API
│   ├── auth/           # Autenticação
│   └── config/         # Configurações
└── app/                # Next.js App Router
```

### 2. **Patterns Implementados**

#### A. **Repository Pattern**
- Abstração da camada de dados
- Facilita testes e manutenção
- Centraliza lógica de API

```typescript
// features/clientes/services/cliente.repository.ts
export class ClienteRepository {
  async findAll(filters?: ClienteFilters): Promise<Cliente[]>
  async findById(id: number): Promise<Cliente>
  async create(data: CreateClienteDTO): Promise<Cliente>
  async update(id: number, data: UpdateClienteDTO): Promise<Cliente>
  async delete(id: number): Promise<void>
}
```

#### B. **Service Layer Pattern**
- Lógica de negócio separada
- Validações e transformações
- Orquestração de múltiplos repositórios

```typescript
// features/clientes/services/cliente.service.ts
export class ClienteService {
  constructor(
    private clienteRepo: ClienteRepository,
    private historicoRepo: HistoricoRepository
  ) {}

  async criarCliente(data: CreateClienteDTO) {
    // Validações
    // Transformações
    // Lógica de negócio
    // Chamadas aos repositórios
  }
}
```

#### C. **Custom Hooks Pattern**
- Encapsulamento de lógica de estado
- Reutilização de comportamentos
- Separação de concerns

```typescript
// features/clientes/hooks/useCliente.ts
export function useCliente(id: number) {
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Lógica de fetch, cache, etc.

  return { cliente, loading, error, refetch }
}
```

#### D. **Compound Components Pattern**
- Componentes flexíveis e composáveis
- Melhor DX (Developer Experience)
- Ideal para formulários e tabelas

```typescript
// shared/components/DataTable/index.tsx
<DataTable data={clientes}>
  <DataTable.Header>
    <DataTable.Column field="nome" sortable />
    <DataTable.Column field="email" />
  </DataTable.Header>
  <DataTable.Body>
    {(cliente) => (
      <DataTable.Row key={cliente.id}>
        <DataTable.Cell>{cliente.nome}</DataTable.Cell>
        <DataTable.Cell>{cliente.email}</DataTable.Cell>
      </DataTable.Row>
    )}
  </DataTable.Body>
</DataTable>
```

#### E. **Provider Pattern**
- Gerenciamento de estado global
- Contextos específicos por feature
- Evita prop drilling

```typescript
// features/clientes/context/ClienteContext.tsx
export function ClienteProvider({ children }) {
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
  const [filters, setFilters] = useState<ClienteFilters>({})

  return (
    <ClienteContext.Provider value={{ selectedCliente, filters, ... }}>
      {children}
    </ClienteContext.Provider>
  )
}
```

### 3. **Componentes Essenciais para CRM**

#### A. **Layout Components**
- `DashboardLayout` - Layout principal com sidebar
- `PageHeader` - Cabeçalho de página com breadcrumbs
- `Sidebar` - Navegação lateral
- `TopBar` - Barra superior com notificações

#### B. **Data Display Components**
- `DataTable` - Tabela com paginação, filtros, ordenação
- `KanbanBoard` - Quadro Kanban para pipeline
- `Timeline` - Linha do tempo de atividades
- `StatCard` - Cards de estatísticas
- `Chart` - Gráficos (Line, Bar, Pie, Donut)

#### C. **Form Components**
- `FormBuilder` - Construtor de formulários dinâmicos
- `SearchBar` - Busca com autocomplete
- `FilterPanel` - Painel de filtros avançados
- `DateRangePicker` - Seletor de período
- `MultiSelect` - Seleção múltipla

#### D. **Action Components**
- `ActionMenu` - Menu de ações contextuais
- `BulkActions` - Ações em massa
- `QuickActions` - Ações rápidas (FAB)
- `ConfirmDialog` - Diálogo de confirmação

#### E. **Feedback Components**
- `Toast` - Notificações temporárias
- `LoadingState` - Estados de carregamento
- `EmptyState` - Estado vazio
- `ErrorBoundary` - Tratamento de erros

### 4. **State Management Strategy**

#### A. **Local State** (useState, useReducer)
- Estado de UI (modals, dropdowns)
- Formulários simples
- Componentes isolados

#### B. **Context API**
- Estado compartilhado entre features
- Autenticação
- Tema/Preferências

#### C. **Server State** (React Query / SWR)
- Dados do servidor
- Cache automático
- Sincronização
- Revalidação

```typescript
// features/clientes/hooks/useClientes.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useClientes(filters?: ClienteFilters) {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['clientes', filters],
    queryFn: () => clienteService.findAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
  })

  const createMutation = useMutation({
    mutationFn: clienteService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
    },
  })

  return {
    clientes: data,
    isLoading,
    error,
    createCliente: createMutation.mutate,
  }
}
```

### 5. **Performance Optimization**

#### A. **Code Splitting**
```typescript
// Lazy loading de features
const ClientesPage = lazy(() => import('@/features/clientes/pages/ClientesPage'))
const ContratosPage = lazy(() => import('@/features/contratos/pages/ContratosPage'))
```

#### B. **Memoization**
```typescript
// Componentes pesados
const DataTable = memo(DataTableComponent)

// Callbacks
const handleFilter = useCallback((filters) => {
  // ...
}, [dependencies])

// Valores computados
const filteredData = useMemo(() => {
  return data.filter(item => /* ... */)
}, [data, filters])
```

#### C. **Virtual Scrolling**
```typescript
// Para listas grandes
import { useVirtualizer } from '@tanstack/react-virtual'

const rowVirtualizer = useVirtualizer({
  count: clientes.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 50,
})
```

### 6. **Error Handling Strategy**

```typescript
// shared/utils/error-handler.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number
  ) {
    super(message)
  }
}

export function handleApiError(error: unknown): AppError {
  if (error instanceof AppError) return error

  if (axios.isAxiosError(error)) {
    return new AppError(
      error.response?.data?.message || 'Erro na requisição',
      error.response?.data?.code || 'API_ERROR',
      error.response?.status || 500
    )
  }

  return new AppError('Erro desconhecido', 'UNKNOWN_ERROR', 500)
}
```

### 7. **Testing Strategy**

#### A. **Unit Tests**
- Hooks customizados
- Utilitários
- Serviços

#### B. **Integration Tests**
- Componentes com lógica
- Fluxos de formulários
- Interações de usuário

#### C. **E2E Tests**
- Fluxos críticos (login, cadastro)
- Jornadas de usuário
- Cenários de negócio

### 8. **Security Best Practices**

#### A. **Authentication**
- JWT tokens
- Refresh token rotation
- Secure storage (httpOnly cookies)

#### B. **Authorization**
- Role-based access control (RBAC)
- Permission-based UI
- Route guards

#### C. **Data Protection**
- Input sanitization
- XSS prevention
- CSRF protection
- Rate limiting

### 9. **Accessibility (a11y)**

```typescript
// Componentes acessíveis
<button
  aria-label="Adicionar cliente"
  aria-describedby="add-client-description"
  onClick={handleAdd}
>
  <PlusIcon aria-hidden="true" />
  Adicionar
</button>

// Navegação por teclado
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick()
    }
  }}
>
```

### 10. **Documentation Standards**

```typescript
/**
 * Hook para gerenciar clientes
 *
 * @param filters - Filtros opcionais para busca
 * @returns Objeto com clientes, loading, error e funções de mutação
 *
 * @example
 * ```tsx
 * const { clientes, isLoading, createCliente } = useClientes({ ativo: true })
 * ```
 */
export function useClientes(filters?: ClienteFilters) {
  // ...
}
```

## Próximos Passos

1. Reestruturar projeto para feature-based architecture
2. Implementar Repository Pattern
3. Adicionar React Query para server state
4. Criar componentes base reutilizáveis
5. Implementar error boundaries
6. Adicionar testes unitários
7. Configurar CI/CD
