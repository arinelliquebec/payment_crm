# Exemplos de Uso - Componentes Shared

## 1. DataTable

```typescript
import { DataTable, Column } from "@/shared/components";
import { useClientes, getClienteNome } from "@/features/clientes";

function ClientesTable() {
  const { data: clientes, isLoading } = useClientes();

  const columns: Column<Cliente>[] = [
    {
      key: "id",
      label: "ID",
      sortable: true,
      width: "80px",
    },
    {
      key: "nome",
      label: "Nome",
      sortable: true,
      render: (cliente) => getClienteNome(cliente),
    },
    {
      key: "situacao",
      label: "Situação",
      sortable: true,
      render: (cliente) => (
        <Badge variant={cliente.ativo ? "success" : "neutral"}>
          {cliente.situacao}
        </Badge>
      ),
    },
    {
      key: "ativo",
      label: "Status",
      render: (cliente) => (
        <Badge variant={cliente.ativo ? "success" : "error"}>
          {cliente.ativo ? "Ativo" : "Inativo"}
        </Badge>
      ),
    },
  ];

  return (
    <DataTable
      data={clientes || []}
      columns={columns}
      keyExtractor={(cliente) => cliente.id}
      onRowClick={(cliente) => router.push(`/clientes/${cliente.id}`)}
      loading={isLoading}
      emptyMessage="Nenhum cliente encontrado"
    />
  );
}
```

## 2. LoadingState

```typescript
import { LoadingState } from "@/shared/components";

// Loading simples
function MyComponent() {
  const { isLoading } = useClientes();

  if (isLoading) {
    return <LoadingState />;
  }

  return <div>Content</div>;
}

// Loading full screen
function App() {
  return (
    <LoadingState
      message="Carregando aplicação..."
      size="lg"
      fullScreen
    />
  );
}

// Loading pequeno
function SmallLoader() {
  return <LoadingState message="Salvando..." size="sm" />;
}
```

## 3. EmptyState

```typescript
import { EmptyState } from "@/shared/components";
import { Users } from "lucide-react";

function ClientesList() {
  const { data: clientes } = useClientes();

  if (clientes?.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Nenhum cliente cadastrado"
        description="Comece adicionando seu primeiro cliente ao sistema"
        action={{
          label: "Adicionar Cliente",
          onClick: () => router.push("/clientes/novo"),
        }}
      />
    );
  }

  return <div>{/* Lista de clientes */}</div>;
}
```

## 4. ErrorBoundary

```typescript
import { ErrorBoundary } from "@/shared/components";

// Envolver componentes que podem dar erro
function App() {
  return (
    <ErrorBoundary>
      <MyComponent />
    </ErrorBoundary>
  );
}

// Com fallback customizado
function AppWithCustomError() {
  return (
    <ErrorBoundary
      fallback={
        <div>
          <h1>Ops! Algo deu errado</h1>
          <button onClick={() => window.location.reload()}>
            Tentar novamente
          </button>
        </div>
      }
    >
      <MyComponent />
    </ErrorBoundary>
  );
}

// No layout principal
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ErrorBoundary>
          <QueryProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

## 5. Badge

```typescript
import { Badge } from "@/shared/components";

function StatusBadges() {
  return (
    <div className="flex gap-2">
      <Badge variant="default">Padrão</Badge>
      <Badge variant="success">Ativo</Badge>
      <Badge variant="warning">Pendente</Badge>
      <Badge variant="error">Inativo</Badge>
      <Badge variant="info">Informação</Badge>
      <Badge variant="neutral">Neutro</Badge>
    </div>
  );
}

// Badge dinâmico baseado em status
function ClienteStatus({ cliente }: { cliente: Cliente }) {
  const variant = cliente.ativo ? "success" : "error";
  return <Badge variant={variant}>{cliente.situacao}</Badge>;
}
```

## 6. Card

```typescript
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/shared/components";

function ClienteCard({ cliente }: { cliente: Cliente }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{getClienteNome(cliente)}</CardTitle>
        <CardDescription>
          Cliente desde {format(new Date(cliente.dataCadastro), "dd/MM/yyyy")}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-2">
          <p>
            <strong>Situação:</strong> {cliente.situacao}
          </p>
          <p>
            <strong>Tipo:</strong> {cliente.tipoPessoa}
          </p>
          <p>
            <strong>Consultor:</strong> {cliente.consultor?.nome || "N/A"}
          </p>
        </div>
      </CardContent>

      <CardFooter>
        <button className="btn-primary">Ver Detalhes</button>
      </CardFooter>
    </Card>
  );
}

// Card simples
function SimpleCard() {
  return (
    <Card className="p-6">
      <h3 className="font-bold mb-2">Título</h3>
      <p>Conteúdo do card</p>
    </Card>
  );
}
```

## 7. Combinando Componentes

```typescript
import {
  DataTable,
  LoadingState,
  EmptyState,
  ErrorBoundary,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/shared/components";

function ClientesPage() {
  const { data: clientes, isLoading, error } = useClientes();

  return (
    <ErrorBoundary>
      <Card>
        <CardHeader>
          <CardTitle>Clientes</CardTitle>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <LoadingState message="Carregando clientes..." />
          ) : error ? (
            <EmptyState
              title="Erro ao carregar clientes"
              description={error.message}
            />
          ) : clientes?.length === 0 ? (
            <EmptyState
              title="Nenhum cliente encontrado"
              action={{
                label: "Adicionar Cliente",
                onClick: () => router.push("/clientes/novo"),
              }}
            />
          ) : (
            <DataTable
              data={clientes || []}
              columns={columns}
              keyExtractor={(c) => c.id}
              onRowClick={(c) => router.push(`/clientes/${c.id}`)}
            />
          )}
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
}
```

## Benefícios

✅ **Reutilizáveis** - Use em qualquer lugar
✅ **Consistentes** - Design system unificado
✅ **Type-safe** - TypeScript completo
✅ **Acessíveis** - Boas práticas de a11y
✅ **Customizáveis** - Props flexíveis
✅ **Performáticos** - Otimizados
