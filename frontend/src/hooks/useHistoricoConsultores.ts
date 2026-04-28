// src/hooks/useHistoricoConsultores.ts
import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";
import { HistoricoConsultor, AtribuirClienteDTO } from "@/types/api";

interface UseHistoricoConsultoresState {
  historico: HistoricoConsultor[];
  loading: boolean;
  error: string | null;
  atribuindo: boolean;
}

export function useHistoricoConsultores() {
  const [state, setState] = useState<UseHistoricoConsultoresState>({
    historico: [],
    loading: false,
    error: null,
    atribuindo: false,
  });

  const fetchHistoricoConsultores = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await apiClient.get("/HistoricoConsultor");
      setState((prev) => ({
        ...prev,
        historico: response.data as HistoricoConsultor[],
        loading: false,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error:
          error.response?.data?.message ||
          "Erro ao carregar histórico de consultores",
        loading: false,
      }));
    }
  }, []);

  const atribuirCliente = useCallback(async (data: AtribuirClienteDTO) => {
    setState((prev) => ({ ...prev, atribuindo: true, error: null }));
    try {
      await apiClient.post("/Consultor/atribuir-cliente", data);
      setState((prev) => ({
        ...prev,
        atribuindo: false,
      }));
      return true;
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error: error.response?.data?.message || "Erro ao atribuir cliente",
        atribuindo: false,
      }));
      return false;
    }
  }, []);

  const getHistoricoCliente = useCallback(async (clienteId: number) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await apiClient.get(`/Cliente/${clienteId}/historico`);
      setState((prev) => ({
        ...prev,
        historico: response.data as HistoricoConsultor[],
        loading: false,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error:
          error.response?.data?.message ||
          "Erro ao carregar histórico do cliente",
        loading: false,
      }));
    }
  }, []);

  const getClientesConsultor = useCallback(async (consultorId: number) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await apiClient.get(
        `/Consultor/${consultorId}/clientes`
      );
      setState((prev) => ({
        ...prev,
        historico: response.data as HistoricoConsultor[],
        loading: false,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error:
          error.response?.data?.message ||
          "Erro ao carregar clientes do consultor",
        loading: false,
      }));
    }
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    fetchHistoricoConsultores,
    atribuirCliente,
    getHistoricoCliente,
    getClientesConsultor,
    clearError,
  };
}
