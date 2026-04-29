// src/hooks/useBoletos.ts
import { useState, useCallback } from "react";
import { API_ENDPOINTS } from "@/core/api/endpoints";
import { apiClient } from "@/lib/api";
import {
  Boleto,
  CreateBoletoDTO,
  DashboardFinanceiro,
  BoletoFilters,
  BoletosListagemResumo,
  parseBoletosListResponse,
  parseResumoPayload,
} from "@/types/boleto";

interface UseBoletosState {
  boletos: Boleto[];
  listagemResumo: BoletosListagemResumo | null;
  dashboard: DashboardFinanceiro | null;
  loading: boolean;
  error: string | null;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  syncing: boolean;
}

export function useBoletos() {
  const [state, setState] = useState<UseBoletosState>({
    boletos: [],
    listagemResumo: null,
    dashboard: null,
    loading: false,
    error: null,
    creating: false,
    updating: false,
    deleting: false,
    syncing: false,
  });

  const fetchBoletos = useCallback(async (filters?: BoletoFilters) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      console.log("🔧 useBoletos: Buscando boletos da API...");

      // Construir URL com query parameters
      let endpoint = "/Boleto";
      if (filters) {
        const params = new URLSearchParams();
        if (filters.status) params.append("status", filters.status);
        if (filters.contratoId)
          params.append("contratoId", filters.contratoId.toString());
        if (filters.clienteNome)
          params.append("clienteNome", filters.clienteNome);
        if (filters.dataInicio) params.append("dataInicio", filters.dataInicio);
        if (filters.dataFim) params.append("dataFim", filters.dataFim);
        if (filters.valorMinimo)
          params.append("valorMinimo", filters.valorMinimo.toString());
        if (filters.valorMaximo)
          params.append("valorMaximo", filters.valorMaximo.toString());

        const queryString = params.toString();
        if (queryString) {
          endpoint += `?${queryString}`;
        }
      }

      const [listRes, dashRes] = await Promise.all([
        apiClient.get(endpoint),
        apiClient.get(API_ENDPOINTS.BOLETOS.DASHBOARD),
      ]);

      if (listRes.error) {
        throw new Error(listRes.error);
      }

      const { boletos, resumo } = parseBoletosListResponse(listRes.data);
      const listagemResumo =
        resumo ??
        (!dashRes.error && dashRes.data
          ? parseResumoPayload(dashRes.data)
          : null);

      setState((prev) => ({
        ...prev,
        boletos,
        listagemResumo,
        dashboard:
          dashRes.data && !dashRes.error
            ? (dashRes.data as DashboardFinanceiro)
            : prev.dashboard,
        loading: false,
      }));
    } catch (error: any) {
      console.error("🔧 useBoletos: Erro:", error);
      setState((prev) => ({
        ...prev,
        error: error.message || "Erro ao carregar boletos",
        loading: false,
      }));
    }
  }, []);

  const fetchBoletosPorContrato = useCallback(async (contratoId: number) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      console.log(
        `🔧 useBoletos: Buscando boletos do contrato ${contratoId}...`
      );
      const response = await apiClient.get(`/Boleto/contrato/${contratoId}`);

      if (response.error) {
        throw new Error(response.error);
      }

      const { boletos, resumo } = parseBoletosListResponse(response.data);

      setState((prev) => ({
        ...prev,
        boletos,
        listagemResumo: resumo,
        loading: false,
      }));
    } catch (error: any) {
      console.error("🔧 useBoletos: Erro:", error);
      setState((prev) => ({
        ...prev,
        error: error.message || "Erro ao carregar boletos do contrato",
        loading: false,
      }));
    }
  }, []);

  const fetchDashboard = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      console.log("🔧 useBoletos: Buscando dashboard financeiro...");
      const response = await apiClient.get(API_ENDPOINTS.BOLETOS.DASHBOARD);

      if (response.error) {
        throw new Error(response.error);
      }

      setState((prev) => ({
        ...prev,
        dashboard: response.data as DashboardFinanceiro,
        loading: false,
      }));
    } catch (error: any) {
      console.error("🔧 useBoletos: Erro:", error);
      setState((prev) => ({
        ...prev,
        error: error.message || "Erro ao carregar dashboard",
        loading: false,
      }));
    }
  }, []);

  const createBoleto = useCallback(async (data: CreateBoletoDTO) => {
    setState((prev) => ({ ...prev, creating: true, error: null }));
    try {
      console.log("🔧 useBoletos: Criando boleto...");
      const response = await apiClient.post("/Boleto", data);

      if (response.error) {
        throw new Error(response.error);
      }

      setState((prev) => ({
        ...prev,
        boletos: [response.data as Boleto, ...prev.boletos],
        creating: false,
      }));

      return response.data as Boleto;
    } catch (error: any) {
      console.error("🔧 useBoletos: Erro:", error);
      setState((prev) => ({
        ...prev,
        error: error.message || "Erro ao criar boleto",
        creating: false,
      }));
      throw error;
    }
  }, []);

  const syncBoleto = useCallback(async (id: number) => {
    setState((prev) => ({ ...prev, syncing: true, error: null }));
    try {
      console.log(`🔧 useBoletos: Sincronizando boleto ${id}...`);
      const response = await apiClient.put(`/Boleto/${id}/sincronizar`, {});

      if (response.error) {
        throw new Error(response.error);
      }

      setState((prev) => ({
        ...prev,
        boletos: prev.boletos.map((b) =>
          b.id === id ? (response.data as Boleto) : b
        ),
        syncing: false,
      }));

      return response.data as Boleto;
    } catch (error: any) {
      console.error("🔧 useBoletos: Erro:", error);
      setState((prev) => ({
        ...prev,
        error: error.message || "Erro ao sincronizar boleto",
        syncing: false,
      }));
      throw error;
    }
  }, []);

  const deleteBoleto = useCallback(async (id: number) => {
    setState((prev) => ({ ...prev, deleting: true, error: null }));
    try {
      console.log(`🔧 useBoletos: Cancelando boleto ${id}...`);
      const response = await apiClient.delete(`/Boleto/${id}`);

      if (response.error) {
        throw new Error(response.error);
      }

      setState((prev) => ({
        ...prev,
        boletos: prev.boletos.filter((b) => b.id !== id),
        deleting: false,
      }));

      return true;
    } catch (error: any) {
      console.error("🔧 useBoletos: Erro:", error);
      setState((prev) => ({
        ...prev,
        error: error.message || "Erro ao cancelar boleto",
        deleting: false,
      }));
      throw error;
    }
  }, []);

  const getBoleto = useCallback(async (id: number) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      console.log(`🔧 useBoletos: Buscando boleto ${id}...`);
      const response = await apiClient.get(`/Boleto/${id}`);

      if (response.error) {
        throw new Error(response.error);
      }

      setState((prev) => ({ ...prev, loading: false }));
      return response.data as Boleto;
    } catch (error: any) {
      console.error("🔧 useBoletos: Erro:", error);
      setState((prev) => ({
        ...prev,
        error: error.message || "Erro ao buscar boleto",
        loading: false,
      }));
      throw error;
    }
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    fetchBoletos,
    fetchBoletosPorContrato,
    fetchDashboard,
    createBoleto,
    syncBoleto,
    deleteBoleto,
    getBoleto,
    clearError,
  };
}
