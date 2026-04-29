// src/hooks/usePessoasFisicas.ts
import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";
import {
  PessoaFisica,
  CreatePessoaFisicaDTO,
  UpdatePessoaFisicaDTO,
} from "@/types/api";

interface UsePessoasFisicasState {
  pessoas: PessoaFisica[];
  loading: boolean;
  error: string | null;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
}

export function usePessoasFisicas() {
  const [state, setState] = useState<UsePessoasFisicasState>({
    pessoas: [],
    loading: false,
    error: null,
    creating: false,
    updating: false,
    deleting: false,
  });

  const fetchPessoasFisicas = useCallback(
    async (termo?: string, limit: number = 50) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        console.log(
          "🔧 fetchPessoasFisicas: Iniciando busca com termo:",
          termo
        );

        // Usar novo endpoint de busca otimizado
        const endpoint = termo
          ? `/PessoaFisica/buscar?termo=${encodeURIComponent(
              termo
            )}&limit=${limit}`
          : `/PessoaFisica/buscar?limit=${limit}`;

        const response = await apiClient.get(endpoint);
        console.log(
          "🔧 fetchPessoasFisicas: Resposta recebida:",
          Array.isArray(response.data) ? response.data.length : 0,
          "pessoas"
        );

        if (response.error) {
          throw new Error(response.error);
        }

        setState((prev) => ({
          ...prev,
          pessoas: response.data as PessoaFisica[],
          loading: false,
        }));
      } catch (error: any) {
        console.error("🔧 fetchPessoasFisicas: Erro:", error);
        setState((prev) => ({
          ...prev,
          error:
            error.message ||
            error.response?.data?.message ||
            "Erro ao carregar pessoas físicas",
          loading: false,
        }));
      }
    },
    []
  );

  const createPessoaFisica = useCallback(
    async (data: CreatePessoaFisicaDTO) => {
      setState((prev) => ({ ...prev, creating: true, error: null }));
      try {
        const response = await apiClient.post("/PessoaFisica", data);
        setState((prev) => ({
          ...prev,
          pessoas: [...prev.pessoas, response.data as PessoaFisica],
          creating: false,
        }));
        return true;
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          error: error.response?.data?.message || "Erro ao criar pessoa física",
          creating: false,
        }));
        return false;
      }
    },
    []
  );

  const updatePessoaFisica = useCallback(
    async (id: number, data: UpdatePessoaFisicaDTO) => {
      setState((prev) => ({ ...prev, updating: true, error: null }));
      try {
        const response = await apiClient.put(`/PessoaFisica/${id}`, data);
        setState((prev) => ({
          ...prev,
          pessoas: prev.pessoas.map((p) =>
            p.id === id ? (response.data as PessoaFisica) : p
          ),
          updating: false,
        }));
        return true;
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          error:
            error.response?.data?.message || "Erro ao atualizar pessoa física",
          updating: false,
        }));
        return false;
      }
    },
    []
  );

  const deletePessoaFisica = useCallback(async (id: number) => {
    setState((prev) => ({ ...prev, deleting: true, error: null }));
    try {
      await apiClient.delete(`/PessoaFisica/${id}`);
      setState((prev) => ({
        ...prev,
        pessoas: prev.pessoas.filter((p) => p.id !== id),
        deleting: false,
      }));
      return true;
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error: error.response?.data?.message || "Erro ao excluir pessoa física",
        deleting: false,
      }));
      return false;
    }
  }, []);

  const buscarPorCpf = useCallback(async (cpf: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      console.log("🔧 buscarPorCpf: Buscando CPF:", cpf);
      const cpfLimpo = cpf.replace(/\D/g, "");
      console.log("🔧 buscarPorCpf: CPF limpo:", cpfLimpo);

      const response = await apiClient.get(
        `/PessoaFisica/buscar-por-cpf/${encodeURIComponent(cpfLimpo)}`
      );
      console.log("🔧 buscarPorCpf: Resposta recebida:", response);

      if (response.error) {
        throw new Error(response.error);
      }

      setState((prev) => ({
        ...prev,
        pessoas: response.data ? [response.data as PessoaFisica] : [],
        loading: false,
      }));

      return response.data as PessoaFisica | null;
    } catch (error: any) {
      console.error("🔧 buscarPorCpf: Erro:", error);
      setState((prev) => ({
        ...prev,
        error: error.message || "Erro ao buscar pessoa física por CPF",
        loading: false,
      }));
      return null;
    }
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // NÃO carregar automaticamente - apenas quando necessário
  // Remover o useEffect que carrega automaticamente para melhor performance

  return {
    ...state,
    fetchPessoasFisicas,
    buscarPorCpf,
    createPessoaFisica,
    updatePessoaFisica,
    deletePessoaFisica,
    clearError,
  };
}
