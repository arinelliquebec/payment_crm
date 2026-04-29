# Exemplos de Uso - Feature Clientes

## 1. Listar Clientes

```typescript
import { useClientes } from "@/features/clientes";

function ClientesPage() {
  const { data: clientes, isLoading, error } = useClientes();

  if (isLoading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error.message}</div>;

  return (
    <div>
      {clientes?.map((cliente) => (
        <div key={cliente.id}>{getClienteNome(cliente)}</div>
      ))}
    </div>
  );
}
```

## 2. Listar com Filtros

```typescript
import { useClientes } from "@/features/clientes";

function ClientesAtivosPage() {
  const filters = {
    ativo: true,
    situacao: "Qualificado",
    tipoPessoa: "Fisica" as const,
  };

  const { data: clientes, isLoading } = useClientes(filters);

  // ...
}
```

## 3. Buscar Cliente Específico

```typescript
import { useCliente } from "@/features/clientes";

function ClienteDetailPage({ id }: { id: number }) {
  const { data: cliente, isLoading, error } = useCliente(id);

  if (isLoading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error.message}</div>;
  if (!cliente) return <div>Cliente não encontrado</div>;

  return (
    <div>
      <h1>{getClienteNome(cliente)}</h1>
      <p>Situação: {cliente.situacao}</p>
      <p>Tipo: {cliente.tipoPessoa}</p>
    </div>
  );
}
```

## 4. Criar Cliente

```typescript
import { useCreateCliente } from "@/features/clientes";
import { toast } from "sonner";

function CreateClienteForm() {
  const createCliente = useCreateCliente();

  const handleSubmit = async (data: CreateClienteDTO) => {
    createCliente.mutate(data, {
      onSuccess: (newCliente) => {
        toast.success("Cliente criado com sucesso!");
        router.push(`/clientes/${newCliente.id}`);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button
        type="submit"
        disabled={createCliente.isPending}
      >
        {createCliente.isPending ? "Criando..." : "Criar Cliente"}
      </button>
    </form>
  );
}
```

## 5. Atualizar Cliente

```typescript
import { useUpdateCliente } from "@/features/clientes";

function EditClienteForm({ clienteId }: { clienteId: number }) {
  const updateCliente = useUpdateCliente();

  const handleSubmit = async (data: UpdateClienteDTO) => {
    updateCliente.mutate(
      { id: clienteId, data },
      {
        onSuccess: () => {
          toast.success("Cliente atualizado!");
        },
        onError: (error) => {
          toast.error(error.message);
        },
      }
    );
  };

  // ...
}
```

## 6. Deletar Cliente

```typescript
import { useDeleteCliente } from "@/features/clientes";

function DeleteClienteButton({ clienteId }: { clienteId: number }) {
  const deleteCliente = useDeleteCliente();

  const handleDelete = () => {
    if (confirm("Tem certeza que deseja excluir este cliente?")) {
      deleteCliente.mutate(clienteId, {
        onSuccess: () => {
          toast.success("Cliente excluído!");
          router.push("/clientes");
        },
        onError: (error) => {
          toast.error(error.message);
        },
      });
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={deleteCliente.isPending}
    >
      {deleteCliente.isPending ? "Excluindo..." : "Excluir"}
    </button>
  );
}
```

## 7. Operações Especiais

```typescript
import {
  useInativarCliente,
  useMudarSituacaoCliente,
  useAtribuirConsultor,
} from "@/features/clientes";

function ClienteActions({ clienteId }: { clienteId: number }) {
  const inativarCliente = useInativarCliente();
  const mudarSituacao = useMudarSituacaoCliente();
  const atribuirConsultor = useAtribuirConsultor();

  return (
    <div>
      <button
        onClick={() =>
          inativarCliente.mutate(clienteId, {
            onSuccess: () => toast.success("Cliente inativado!"),
          })
        }
      >
        Inativar
      </button>

      <button
        onClick={() =>
          mudarSituacao.mutate(
            { id: clienteId, situacao: "Fechado" },
            {
              onSuccess: () => toast.success("Situação atualizada!"),
            }
          )
        }
      >
        Marcar como Fechado
      </button>

      <button
        onClick={() =>
          atribuirConsultor.mutate(
            { id: clienteId, consultorId: 5 },
            {
              onSuccess: () => toast.success("Consultor atribuído!"),
            }
          )
        }
      >
        Atribuir Consultor
      </button>
    </div>
  );
}
```

## 8. Hook Agregado (Todas Operações)

```typescript
import { useClienteOperations } from "@/features/clientes";

function ClienteManager() {
  const {
    createCliente,
    updateCliente,
    deleteCliente,
    inativarCliente,
    mudarSituacao,
    isCreating,
    isUpdating,
    isDeleting,
    createError,
  } = useClienteOperations();

  // Usar todas as operações em um único componente
  // ...
}
```

## 9. Com Histórico

```typescript
import { useCliente, useClienteHistorico } from "@/features/clientes";

function ClienteDetailWithHistory({ id }: { id: number }) {
  const { data: cliente } = useCliente(id);
  const { data: historico, isLoading: loadingHistorico } =
    useClienteHistorico(id);

  return (
    <div>
      <h1>{getClienteNome(cliente)}</h1>

      <h2>Histórico</h2>
      {loadingHistorico ? (
        <div>Carregando histórico...</div>
      ) : (
        <ul>
          {historico?.map((item) => (
            <li key={item.id}>{item.descricao}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

## 10. Validação com Zod

```typescript
import { CreateClienteSchema } from "@/features/clientes";

function validateClienteData(data: unknown) {
  try {
    const validData = CreateClienteSchema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors };
    }
    return { success: false, errors: [] };
  }
}
```

## Benefícios

✅ **Type-safe**: TypeScript garante tipos corretos
✅ **Cache automático**: React Query gerencia cache
✅ **Loading states**: Estados de carregamento automáticos
✅ **Error handling**: Tratamento de erros consistente
✅ **Optimistic updates**: Atualizações otimistas
✅ **Revalidação**: Dados sempre atualizados
✅ **DevTools**: Debug fácil com React Query DevTools
