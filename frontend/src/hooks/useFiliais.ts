// src/hooks/useFiliais.ts
import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";

export interface Filial {
  id: number;
  nome: string;
  dataInclusao: string;
  usuarioImportacao?: string;
}

interface UseFiliaisState {
  filiais: Filial[];
  loading: boolean;
  error: string | null;
}

export function useFiliais() {
  const [state, setState] = useState<UseFiliaisState>({
    filiais: [],
    loading: false,
    error: null,
  });

  const fetchFiliais = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      console.log("🔧 fetchFiliais: Iniciando requisição...");
      const response = await apiClient.get("/Filial");
      console.log("🔧 fetchFiliais: Resposta recebida:", response);

      if (response.error) {
        console.error("🔧 fetchFiliais: Erro na resposta:", response.error);
        setState((prev) => ({
          ...prev,
          error: response.error || "Erro desconhecido",
          loading: false,
        }));
        return;
      }

      if (!response.data) {
        console.warn("🔧 fetchFiliais: Dados não encontrados na resposta");
        setState((prev) => ({
          ...prev,
          filiais: [],
          loading: false,
        }));
        return;
      }

      console.log("🔧 fetchFiliais: Dados recebidos:", response.data);

      if (!Array.isArray(response.data)) {
        console.error(
          "🔧 fetchFiliais: Dados não são um array:",
          typeof response.data
        );
        setState((prev) => ({
          ...prev,
          error: "Formato de dados inválido",
          loading: false,
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        filiais: response.data as Filial[],
        loading: false,
      }));
    } catch (error: unknown) {
      console.error("🔧 fetchFiliais: Erro capturado:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao carregar filiais";
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));
    }
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  useEffect(() => {
    fetchFiliais();
  }, [fetchFiliais]);

  return {
    ...state,
    fetchFiliais,
    clearError,
  };
}
