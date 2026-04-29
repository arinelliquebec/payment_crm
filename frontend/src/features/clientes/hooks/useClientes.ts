import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clienteService } from "../services/cliente.service";
import type {
  Cliente,
  CreateClienteDTO,
  UpdateClienteDTO,
  ClienteFilters,
} from "../types/cliente.types";

/**
 * Query keys para clientes
 */
export const clienteKeys = {
  all: ["clientes"] as const,
  lists: () => [...clienteKeys.all, "list"] as const,
  list: (filters?: ClienteFilters) =>
    [...clienteKeys.lists(), filters] as const,
  details: () => [...clienteKeys.all, "detail"] as const,
  detail: (id: number) => [...clienteKeys.details(), id] as const,
  historico: (id: number) => [...clienteKeys.all, "historico", id] as const,
};

/**
 * Hook para buscar todos os clientes
 */
export function useClientes(filters?: ClienteFilters) {
  return useQuery({
    queryKey: clienteKeys.list(filters),
    queryFn: () => clienteService.findAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para buscar um cliente específico
 */
export function useCliente(id: number) {
  return useQuery({
    queryKey: clienteKeys.detail(id),
    queryFn: () => clienteService.findById(id),
    enabled: id > 0,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para buscar histórico do cliente
 */
export function useClienteHistorico(id: number) {
  return useQuery({
    queryKey: clienteKeys.historico(id),
    queryFn: () => clienteService.findHistorico(id),
    enabled: id > 0,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

/**
 * Hook para criar cliente
 */
export function useCreateCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateClienteDTO) => clienteService.create(data),
    onSuccess: (newCliente) => {
      // Invalidar lista de clientes
      queryClient.invalidateQueries({ queryKey: clienteKeys.lists() });

      // Adicionar ao cache
      queryClient.setQueryData(clienteKeys.detail(newCliente.id), newCliente);
    },
  });
}

/**
 * Hook para atualizar cliente
 */
export function useUpdateCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateClienteDTO }) =>
      clienteService.update(id, data),
    onSuccess: (updatedCliente) => {
      // Invalidar lista de clientes
      queryClient.invalidateQueries({ queryKey: clienteKeys.lists() });

      // Atualizar cache do cliente específico
      queryClient.setQueryData(
        clienteKeys.detail(updatedCliente.id),
        updatedCliente
      );
    },
  });
}

/**
 * Hook para deletar cliente
 */
export function useDeleteCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => clienteService.delete(id),
    onSuccess: (_, deletedId) => {
      // Invalidar lista de clientes
      queryClient.invalidateQueries({ queryKey: clienteKeys.lists() });

      // Remover do cache
      queryClient.removeQueries({ queryKey: clienteKeys.detail(deletedId) });
    },
  });
}

/**
 * Hook para inativar cliente
 */
export function useInativarCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => clienteService.inativar(id),
    onSuccess: (updatedCliente) => {
      queryClient.invalidateQueries({ queryKey: clienteKeys.lists() });
      queryClient.setQueryData(
        clienteKeys.detail(updatedCliente.id),
        updatedCliente
      );
    },
  });
}

/**
 * Hook para reativar cliente
 */
export function useReativarCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => clienteService.reativar(id),
    onSuccess: (updatedCliente) => {
      queryClient.invalidateQueries({ queryKey: clienteKeys.lists() });
      queryClient.setQueryData(
        clienteKeys.detail(updatedCliente.id),
        updatedCliente
      );
    },
  });
}

/**
 * Hook para mudar situação do cliente
 */
export function useMudarSituacaoCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, situacao }: { id: number; situacao: string }) =>
      clienteService.mudarSituacao(id, situacao),
    onSuccess: (updatedCliente) => {
      queryClient.invalidateQueries({ queryKey: clienteKeys.lists() });
      queryClient.setQueryData(
        clienteKeys.detail(updatedCliente.id),
        updatedCliente
      );
    },
  });
}

/**
 * Hook para atribuir consultor
 */
export function useAtribuirConsultor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, consultorId }: { id: number; consultorId: number }) =>
      clienteService.atribuirConsultor(id, consultorId),
    onSuccess: (updatedCliente) => {
      queryClient.invalidateQueries({ queryKey: clienteKeys.lists() });
      queryClient.setQueryData(
        clienteKeys.detail(updatedCliente.id),
        updatedCliente
      );
    },
  });
}

/**
 * Hook agregado com todas as operações
 */
export function useClienteOperations() {
  const createMutation = useCreateCliente();
  const updateMutation = useUpdateCliente();
  const deleteMutation = useDeleteCliente();
  const inativarMutation = useInativarCliente();
  const reativarMutation = useReativarCliente();
  const mudarSituacaoMutation = useMudarSituacaoCliente();
  const atribuirConsultorMutation = useAtribuirConsultor();

  return {
    // Mutations
    createCliente: createMutation.mutate,
    updateCliente: updateMutation.mutate,
    deleteCliente: deleteMutation.mutate,
    inativarCliente: inativarMutation.mutate,
    reativarCliente: reativarMutation.mutate,
    mudarSituacao: mudarSituacaoMutation.mutate,
    atribuirConsultor: atribuirConsultorMutation.mutate,

    // Loading states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isInativando: inativarMutation.isPending,
    isReativando: reativarMutation.isPending,
    isMudandoSituacao: mudarSituacaoMutation.isPending,
    isAtribuindoConsultor: atribuirConsultorMutation.isPending,

    // Errors
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
  };
}
