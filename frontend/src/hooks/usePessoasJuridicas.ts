// src/hooks/usePessoasJuridicas.ts
import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";
import {
  PessoaJuridica,
  CreatePessoaJuridicaDTO,
  UpdatePessoaJuridicaDTO,
} from "@/types/api";

interface UsePessoasJuridicasState {
  pessoas: PessoaJuridica[];
  loading: boolean;
  error: string | null;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
}

export function usePessoasJuridicas() {
  const [state, setState] = useState<UsePessoasJuridicasState>({
    pessoas: [],
    loading: false,
    error: null,
    creating: false,
    updating: false,
    deleting: false,
  });

  const fetchPessoasJuridicas = useCallback(
    async (termo?: string, limit: number = 50) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        console.log(
          "🔧 fetchPessoasJuridicas: Iniciando busca com termo:",
          termo
        );

        // Usar novo endpoint de busca otimizado
        const endpoint = termo
          ? `/PessoaJuridica/buscar?termo=${encodeURIComponent(
              termo
            )}&limit=${limit}`
          : `/PessoaJuridica/buscar?limit=${limit}`;

        const response = await apiClient.get(endpoint);
        console.log(
          "🔧 fetchPessoasJuridicas: Resposta recebida:",
          Array.isArray(response.data) ? response.data.length : 0,
          "pessoas"
        );

        setState((prev) => ({
          ...prev,
          pessoas: response.data as PessoaJuridica[],
          loading: false,
        }));
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          error:
            error.response?.data?.message ||
            "Erro ao carregar pessoas jurídicas",
          loading: false,
        }));
      }
    },
    []
  );

  const createPessoaJuridica = useCallback(
    async (data: CreatePessoaJuridicaDTO) => {
      setState((prev) => ({ ...prev, creating: true, error: null }));
      try {
        const response = await apiClient.post("/PessoaJuridica", data);
        setState((prev) => ({
          ...prev,
          pessoas: [...prev.pessoas, response.data as PessoaJuridica],
          creating: false,
        }));
        return true;
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          error:
            error.response?.data?.message || "Erro ao criar pessoa jurídica",
          creating: false,
        }));
        return false;
      }
    },
    []
  );

  const updatePessoaJuridica = useCallback(
    async (id: number, data: UpdatePessoaJuridicaDTO) => {
      setState((prev) => ({ ...prev, updating: true, error: null }));
      try {
        const response = await apiClient.put(`/PessoaJuridica/${id}`, data);
        setState((prev) => ({
          ...prev,
          pessoas: prev.pessoas.map((p) =>
            p.id === id ? (response.data as PessoaJuridica) : p
          ),
          updating: false,
        }));
        return true;
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          error:
            error.response?.data?.message ||
            "Erro ao atualizar pessoa jurídica",
          updating: false,
        }));
        return false;
      }
    },
    []
  );

  const deletePessoaJuridica = useCallback(async (id: number) => {
    setState((prev) => ({ ...prev, deleting: true, error: null }));
    try {
      await apiClient.delete(`/PessoaJuridica/${id}`);
      setState((prev) => ({
        ...prev,
        pessoas: prev.pessoas.filter((p) => p.id !== id),
        deleting: false,
      }));
      return true;
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error:
          error.response?.data?.message || "Erro ao excluir pessoa jurídica",
        deleting: false,
      }));
      return false;
    }
  }, []);

  const buscarPorCnpj = useCallback(async (cnpj: string) => {
    try {
      console.log("🔧 buscarPorCnpj: Buscando CNPJ:", cnpj);
      const cnpjLimpo = cnpj.replace(/\D/g, "");
      console.log("🔧 buscarPorCnpj: CNPJ limpo:", cnpjLimpo);
      const response = await apiClient.get(
        `/PessoaJuridica/buscar-por-cnpj/${encodeURIComponent(cnpjLimpo)}`
      );
      console.log("🔧 buscarPorCnpj: Resposta:", response);
      return response.data as PessoaJuridica;
    } catch (error: unknown) {
      console.error("🔧 buscarPorCnpj: Erro:", error);
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
    fetchPessoasJuridicas,
    createPessoaJuridica,
    updatePessoaJuridica,
    deletePessoaJuridica,
    buscarPorCnpj,
    clearError,
  };
}
