import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { contratoService } from "../services/contrato.service";
import type {
  Contrato,
  CreateContratoDTO,
  UpdateContratoDTO,
  ContratoFilters,
} from "../types/contrato.types";

export const contratoKeys = {
  all: ["contratos"] as const,
  lists: () => [...contratoKeys.all, "list"] as const,
  list: (filters?: ContratoFilters) =>
    [...contratoKeys.lists(), filters] as const,
  details: () => [...contratoKeys.all, "detail"] as const,
  detail: (id: number) => [...contratoKeys.details(), id] as const,
  byCliente: (clienteId: number) =>
    [...contratoKeys.all, "cliente", clienteId] as const,
};

export function useContratos(filters?: ContratoFilters) {
  return useQuery({
    queryKey: contratoKeys.list(filters),
    queryFn: () => contratoService.findAll(filters),
    staleTime: 5 * 60 * 1000,
  });
}

export function useContrato(id: number) {
  return useQuery({
    queryKey: contratoKeys.detail(id),
    queryFn: () => contratoService.findById(id),
    enabled: id > 0,
    staleTime: 5 * 60 * 1000,
  });
}

export function useContratosByCliente(clienteId: number) {
  return useQuery({
    queryKey: contratoKeys.byCliente(clienteId),
    queryFn: () => contratoService.findByCliente(clienteId),
    enabled: clienteId > 0,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateContrato() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateContratoDTO) => contratoService.create(data),
    onSuccess: (newContrato) => {
      queryClient.invalidateQueries({ queryKey: contratoKeys.lists() });
      queryClient.setQueryData(
        contratoKeys.detail(newContrato.id),
        newContrato
      );
      queryClient.invalidateQueries({
        queryKey: contratoKeys.byCliente(newContrato.clienteId),
      });
    },
  });
}

export function useUpdateContrato() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateContratoDTO }) =>
      contratoService.update(id, data),
    onSuccess: (updatedContrato) => {
      queryClient.invalidateQueries({ queryKey: contratoKeys.lists() });
      queryClient.setQueryData(
        contratoKeys.detail(updatedContrato.id),
        updatedContrato
      );
      queryClient.invalidateQueries({
        queryKey: contratoKeys.byCliente(updatedContrato.clienteId),
      });
    },
  });
}

export function useDeleteContrato() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => contratoService.delete(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: contratoKeys.lists() });
      queryClient.removeQueries({ queryKey: contratoKeys.detail(deletedId) });
    },
  });
}

export function useSuspenderContrato() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => contratoService.suspender(id),
    onSuccess: (updatedContrato) => {
      queryClient.invalidateQueries({ queryKey: contratoKeys.lists() });
      queryClient.setQueryData(
        contratoKeys.detail(updatedContrato.id),
        updatedContrato
      );
    },
  });
}

export function useReativarContrato() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => contratoService.reativar(id),
    onSuccess: (updatedContrato) => {
      queryClient.invalidateQueries({ queryKey: contratoKeys.lists() });
      queryClient.setQueryData(
        contratoKeys.detail(updatedContrato.id),
        updatedContrato
      );
    },
  });
}

export function useCancelarContrato() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => contratoService.cancelar(id),
    onSuccess: (updatedContrato) => {
      queryClient.invalidateQueries({ queryKey: contratoKeys.lists() });
      queryClient.setQueryData(
        contratoKeys.detail(updatedContrato.id),
        updatedContrato
      );
    },
  });
}

export function useConcluirContrato() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => contratoService.concluir(id),
    onSuccess: (updatedContrato) => {
      queryClient.invalidateQueries({ queryKey: contratoKeys.lists() });
      queryClient.setQueryData(
        contratoKeys.detail(updatedContrato.id),
        updatedContrato
      );
    },
  });
}

export function useContratoOperations() {
  const createMutation = useCreateContrato();
  const updateMutation = useUpdateContrato();
  const deleteMutation = useDeleteContrato();
  const suspenderMutation = useSuspenderContrato();
  const reativarMutation = useReativarContrato();
  const cancelarMutation = useCancelarContrato();
  const concluirMutation = useConcluirContrato();

  return {
    createContrato: createMutation.mutate,
    updateContrato: updateMutation.mutate,
    deleteContrato: deleteMutation.mutate,
    suspenderContrato: suspenderMutation.mutate,
    reativarContrato: reativarMutation.mutate,
    cancelarContrato: cancelarMutation.mutate,
    concluirContrato: concluirMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
  };
}
