# Guia de Implementação - CRM Arrighi

## Nova Estrutura de Pastas

```
src/
├── app/                          # Next.js App Router (rotas)
│   ├── (auth)/                  # Grupo de rotas de autenticação
│   │   ├── login/
│   │   └── cadastro/
│   ├── (dashboard)/             # Grupo de rotas protegidas
│   │   ├── layout.tsx          # Layout com sidebar
│   │   ├── dashboard/
│   │   ├── clientes/
│   │   ├── contratos/
│   │   └── usuarios/
│   ├── layout.tsx              # Root layout
│   └── globals.css
│
├── features/                    # Módulos por funcionalidade
│   ├── clientes/
│   │   ├── components/
│   │   │   ├── ClienteCard.tsx
│   │   │   ├── ClienteForm.tsx
│   │   │   ├── ClienteList.tsx
│   │   │   └── ClienteFilters.tsx
│   │   ├── hooks/
│   │   │   ├── useCliente.ts
│   │   │   ├── useClientes.ts
│   │   │   └── useClienteForm.ts
│   │   ├── services/
│   │   │   ├── cliente.repository.ts
│   │   │   ├── cliente.service.ts
│   │   │   └── cliente.validator.ts
│   │   ├── types/
│   │   │   └── cliente.types.ts
│   │   └── utils/
│   │       └── cliente.utils.ts
│   │
│   ├── contratos/
│   │   └── ... (mesma estrutura)
│   │
│   ├── dashboard/
│   │   ├── components/
│   │   │   ├── StatCards.tsx
│   │   │   ├── RecentActivity.tsx
│   │   │   └── Charts/
│   │   ├── hooks/
│   │   │   └── useDashboardData.ts
│   │   └── services/
│   │       └── dashboard.service.ts
│   │
│   └── usuarios/
│       └── ... (mesma estrutura)
│
├── shared/                      # Código compartilhado
│   ├── components/
│   │   ├── ui/                 # Componentes base
│   │   │   ├── Button/
│   │   │   ├── Input/
│   │   │   ├── Modal/
│   │   │   ├── Table/
│   │   │   └── Card/
│   │   ├── layout/             # Componentes de layout
│   │   │   ├── DashboardLayout/
│   │   │   ├── Sidebar/
│   │   │   ├── TopBar/
│   │   │   └── PageHeader/
│   │   └── feedback/           # Componentes de feedback
│   │       ├── Toast/
│   │       ├── LoadingState/
│   │       ├── EmptyState/
│   │       └── ErrorBoundary/
│   │
│   ├── hooks/
│   │   ├── useDebounce.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useMediaQuery.ts
│   │   └── usePagination.ts
│   │
│   ├── services/
│   │   ├── storage.service.ts
│   │   └── notification.service.ts
│   │
│   ├── types/
│   │   ├── common.types.ts
│   │   └── api.types.ts
│   │
│   └── utils/
│       ├── format.ts
│       ├── validation.ts
│       └── date.ts
│
├── core/                        # Configurações core
│   ├── api/
│   │   ├── client.ts           # Axios/Fetch client
│   │   ├── interceptors.ts
│   │   └── endpoints.ts
│   │
│   ├── auth/
│   │   ├── AuthProvider.tsx
│   │   ├── useAuth.ts
│   │   └── auth.service.ts
│   │
│   └── config/
│       ├── env.ts
│       └── constants.ts
│
├── contexts/                    # Contextos globais (legado)
├── components/                  # Componentes (legado)
├── hooks/                       # Hooks (legado)
├── lib/                         # Bibliotecas (legado)
├── services/                    # Serviços (legado)
├── types/                       # Types (legado)
└── utils/                       # Utils (legado)
```

## Migração Gradual

### Fase 1: Setup Inicial (Semana 1)
- [x] Criar nova estrutura de pastas
- [ ] Mover `lib/api.ts` para `core/api/client.ts`
- [ ] Mover `contexts/AuthContext.tsx` para `core/auth/AuthProvider.tsx`
- [ ] Criar componentes base em `shared/components/ui/`

### Fase 2: Feature Clientes (Semana 2)
- [ ] Criar `features/clientes/` completo
- [ ] Implementar Repository Pattern
- [ ] Implementar Service Layer
- [ ] Criar hooks customizados
- [ ] Migrar componentes existentes

### Fase 3: Feature Contratos (Semana 3)
- [ ] Criar `features/contratos/` completo
- [ ] Implementar mesmos patterns
- [ ] Integrar com clientes

### Fase 4: Dashboard (Semana 4)
- [ ] Criar `features/dashboard/`
- [ ] Implementar gráficos
- [ ] Criar cards de estatísticas

### Fase 5: Componentes Compartilhados (Semana 5)
- [ ] DataTable genérico
- [ ] FormBuilder
- [ ] FilterPanel
- [ ] SearchBar

### Fase 6: Otimizações (Semana 6)
- [ ] Implementar React Query
- [ ] Code splitting
- [ ] Virtual scrolling
- [ ] Performance monitoring

## Exemplos de Implementação

### 1. Repository Pattern

```typescript
// features/clientes/services/cliente.repository.ts
import { apiClient } from '@/core/api/client'
import type { Cliente, CreateClienteDTO, UpdateClienteDTO } from '../types/cliente.types'

export class ClienteRepository {
  private readonly basePath = '/Cliente'

  async findAll(filters?: ClienteFilters): Promise<Cliente[]> {
    const response = await apiClient.get(this.basePath, { params: filters })
    return response.data
  }

  async findById(id: number): Promise<Cliente> {
    const response = await apiClient.get(`${this.basePath}/${id}`)
    return response.data
  }

  async create(data: CreateClienteDTO): Promise<Cliente> {
    const response = await apiClient.post(this.basePath, data)
    return response.data
  }

  async update(id: number, data: UpdateClienteDTO): Promise<Cliente> {
    const response = await apiClient.put(`${this.basePath}/${id}`, data)
    return response.data
  }

  async delete(id: number): Promise<void> {
    await apiClient.delete(`${this.basePath}/${id}`)
  }
}

export const clienteRepository = new ClienteRepository()
```

### 2. Service Layer

```typescript
// features/clientes/services/cliente.service.ts
import { clienteRepository } from './cliente.repository'
import { clienteValidator } from './cliente.validator'
import type { CreateClienteDTO } from '../types/cliente.types'

export class ClienteService {
  async criarCliente(data: CreateClienteDTO) {
    // Validação
    const validation = clienteValidator.validate(data)
    if (!validation.isValid) {
      throw new ValidationError(validation.errors)
    }

    // Transformação
    const normalizedData = this.normalizeData(data)

    // Criação
    const cliente = await clienteRepository.create(normalizedData)

    // Log de atividade
    await this.logActivity('cliente_criado', cliente.id)

    return cliente
  }

  private normalizeData(data: CreateClienteDTO) {
    return {
      ...data,
      nome: data.nome.trim().toUpperCase(),
      email: data.email.toLowerCase(),
    }
  }

  private async logActivity(action: string, clienteId: number) {
    // Implementar log
  }
}

export const clienteService = new ClienteService()
```

### 3. Custom Hook com React Query

```typescript
// features/clientes/hooks/useClientes.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clienteService } from '../services/cliente.service'
import type { ClienteFilters } from '../types/cliente.types'

export function useClientes(filters?: ClienteFilters) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['clientes', filters],
    queryFn: () => clienteService.findAll(filters),
    staleTime: 5 * 60 * 1000,
  })

  const createMutation = useMutation({
    mutationFn: clienteService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      toast.success('Cliente criado com sucesso!')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => clienteService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      toast.success('Cliente atualizado com sucesso!')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: clienteService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      toast.success('Cliente excluído com sucesso!')
    },
  })

  return {
    clientes: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createCliente: createMutation.mutate,
    updateCliente: updateMutation.mutate,
    deleteCliente: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
```

### 4. Componente com Compound Pattern

```typescript
// shared/components/ui/DataTable/index.tsx
import { createContext, useContext } from 'react'

const DataTableContext = createContext(null)

export function DataTable({ data, children }) {
  return (
    <DataTableContext.Provider value={{ data }}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200">
          {children}
        </table>
      </div>
    </DataTableContext.Provider>
  )
}

DataTable.Header = function Header({ children }) {
  return (
    <thead className="bg-neutral-50">
      <tr>{children}</tr>
    </thead>
  )
}

DataTable.Column = function Column({ field, label, sortable }) {
  return (
    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
      {label || field}
      {sortable && <SortIcon />}
    </th>
  )
}

DataTable.Body = function Body({ children }) {
  const { data } = useContext(DataTableContext)
  return (
    <tbody className="bg-white divide-y divide-neutral-200">
      {data.map((item) => children(item))}
    </tbody>
  )
}

DataTable.Row = function Row({ children }) {
  return <tr className="hover:bg-neutral-50">{children}</tr>
}

DataTable.Cell = function Cell({ children }) {
  return <td className="px-6 py-4 whitespace-nowrap">{children}</td>
}
```

## Comandos Úteis

```bash
# Instalar React Query
pnpm add @tanstack/react-query

# Instalar Zod para validação
pnpm add zod

# Instalar date-fns (já instalado)
# pnpm add date-fns

# Criar novo feature
mkdir -p src/features/nome-feature/{components,hooks,services,types,utils}
```

## Próximos Passos Imediatos

1. Instalar React Query
2. Mover `lib/api.ts` para `core/api/client.ts`
3. Criar primeiro repository (ClienteRepository)
4. Criar primeiro service (ClienteService)
5. Criar primeiro hook com React Query (useClientes)
6. Testar a nova estrutura
