import { useState, useCallback } from "react";
import { apiClient } from "@/lib/api";
import { Cliente } from "@/types/api";

interface UseClienteSearchState {
  loading: boolean;
  error: string | null;
}

export function useClienteSearch() {
  const [state, setState] = useState<UseClienteSearchState>({
    loading: false,
    error: null,
  });

  const buscarPorCpf = useCallback(
    async (cpf: string): Promise<Cliente | null> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        console.log("🔧 useClienteSearch.buscarPorCpf: Buscando CPF:", cpf);
        const cpfLimpo = cpf.replace(/\D/g, "");
        console.log("🔧 useClienteSearch.buscarPorCpf: CPF limpo:", cpfLimpo);

        const response = await apiClient.get(
          `/Cliente/buscar-por-cpf/${encodeURIComponent(cpfLimpo)}`
        );
        console.log(
          "🔧 useClienteSearch.buscarPorCpf: Resposta recebida:",
          response
        );

        if (response.error) {
          throw new Error(response.error);
        }

        setState((prev) => ({ ...prev, loading: false }));
        return response.data as Cliente | null;
      } catch (error: any) {
        console.error("🔧 useClienteSearch.buscarPorCpf: Erro:", error);
        setState((prev) => ({
          ...prev,
          error: error.message || "Erro ao buscar cliente por CPF",
          loading: false,
        }));
        return null;
      }
    },
    []
  );

  const buscarPorCnpj = useCallback(
    async (cnpj: string): Promise<Cliente | null> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        console.log("🔧 useClienteSearch.buscarPorCnpj: Buscando CNPJ:", cnpj);
        const cnpjLimpo = cnpj.replace(/\D/g, "");
        console.log(
          "🔧 useClienteSearch.buscarPorCnpj: CNPJ limpo:",
          cnpjLimpo
        );

        const response = await apiClient.get(
          `/Cliente/buscar-por-cnpj/${encodeURIComponent(cnpjLimpo)}`
        );
        console.log(
          "🔧 useClienteSearch.buscarPorCnpj: Resposta recebida:",
          response
        );

        if (response.error) {
          throw new Error(response.error);
        }

        setState((prev) => ({ ...prev, loading: false }));
        return response.data as Cliente | null;
      } catch (error: any) {
        console.error("🔧 useClienteSearch.buscarPorCnpj: Erro:", error);
        setState((prev) => ({
          ...prev,
          error: error.message || "Erro ao buscar cliente por CNPJ",
          loading: false,
        }));
        return null;
      }
    },
    []
  );

  const buscarPorDocumento = useCallback(
    async (documento: string): Promise<Cliente | null> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        console.log(
          "🔧 useClienteSearch.buscarPorDocumento: Buscando documento:",
          documento
        );
        const documentoLimpo = documento.replace(/\D/g, "");
        console.log(
          "🔧 useClienteSearch.buscarPorDocumento: Documento limpo:",
          documentoLimpo
        );

        const response = await apiClient.get(
          `/Cliente/buscar-por-documento/${encodeURIComponent(documentoLimpo)}`
        );
        console.log(
          "🔧 useClienteSearch.buscarPorDocumento: Resposta recebida:",
          response
        );

        if (response.error) {
          throw new Error(response.error);
        }

        setState((prev) => ({ ...prev, loading: false }));
        return response.data as Cliente | null;
      } catch (error: any) {
        console.error("🔧 useClienteSearch.buscarPorDocumento: Erro:", error);
        setState((prev) => ({
          ...prev,
          error: error.message || "Erro ao buscar cliente por documento",
          loading: false,
        }));
        return null;
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    buscarPorCpf,
    buscarPorCnpj,
    buscarPorDocumento,
    clearError,
  };
}
