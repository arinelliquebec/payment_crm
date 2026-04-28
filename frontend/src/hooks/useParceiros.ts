// src/hooks/useParceiros.ts
import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";
import { Parceiro, CreateParceiroDTO, UpdateParceiroDTO } from "@/types/api";
import { useAtividadeContext } from "@/contexts/AtividadeContext";

interface UseParceiroState {
  parceiros: Parceiro[];
  loading: boolean;
  error: string | null;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
}

export function useParceiros() {
  const [state, setState] = useState<UseParceiroState>({
    parceiros: [],
    loading: false,
    error: null,
    creating: false,
    updating: false,
    deleting: false,
  });

  const { adicionarAtividade } = useAtividadeContext();

  const fetchParceiros = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      console.log("🔧 useParceiros: Buscando parceiros da API...");
      const response = await apiClient.get("/Parceiro");

      // Verificar se há erro na resposta
      if (response.error) {
        console.error("🔧 useParceiros: Erro na API:", response.error);
        setState((prev) => ({
          ...prev,
          parceiros: [],
          error: response.error || "Erro ao carregar parceiros",
          loading: false,
        }));
        return;
      }

      // Verificar se a resposta é válida
      if (!response.data) {
        console.warn(
          "🔧 useParceiros: API retornou resposta vazia, mas sem erro"
        );
        setState((prev) => ({
          ...prev,
          parceiros: [],
          loading: false,
        }));
        return;
      }

      // Se não for array, tratar como erro
      if (!Array.isArray(response.data)) {
        console.error(
          "🔧 useParceiros: API retornou dados inválidos (não é array):",
          typeof response.data
        );
        setState((prev) => ({
          ...prev,
          parceiros: [],
          error: "Formato de dados inválido recebido da API",
          loading: false,
        }));
        return;
      }

      const parceirosApi = response.data as Parceiro[];

      // Validar que todos os parceiros têm IDs válidos
      const parceirosValidos = parceirosApi.filter((p) => {
        if (!p.id || p.id === undefined || p.id === null || isNaN(p.id)) {
          console.error(
            "🔧 useParceiros: Parceiro com ID inválido encontrado:",
            p
          );
          return false;
        }
        return true;
      });

      if (parceirosValidos.length !== parceirosApi.length) {
        console.warn(
          `🔧 useParceiros: ${
            parceirosApi.length - parceirosValidos.length
          } parceiros com IDs inválidos foram filtrados`
        );
      }

      console.log(
        `🔧 useParceiros: ${parceirosValidos.length} parceiros válidos carregados da API com sucesso`
      );

      setState((prev) => ({
        ...prev,
        parceiros: parceirosValidos,
        loading: false,
      }));
    } catch (error: any) {
      console.error("🔧 useParceiros: Erro ao buscar parceiros:", error);
      setState((prev) => ({
        ...prev,
        parceiros: [],
        error: "Erro de conexão ao carregar parceiros",
        loading: false,
      }));
    }
  }, []);

  const getParceiro = useCallback(async (id: number) => {
    try {
      const response = await apiClient.get(`/Parceiro/${id}`);
      return response.data as Parceiro;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Erro ao buscar parceiro"
      );
    }
  }, []);

  const createParceiro = useCallback(
    async (data: CreateParceiroDTO) => {
      setState((prev) => ({ ...prev, creating: true, error: null }));

      console.log(
        "🔧 createParceiro: Iniciando criação de parceiro com dados:",
        data
      );

      try {
        console.log(
          "🔧 createParceiro: Fazendo requisição POST para /Parceiro"
        );
        const response = await apiClient.post("/Parceiro", data);

        console.log("🔧 createParceiro: Resposta recebida:", {
          status: response.status,
          hasData: !!response.data,
          dataType: typeof response.data,
          data: response.data,
        });

        const novoParceiro = response.data as Parceiro;
        console.log(
          "🔧 createParceiro: Parceiro criado com sucesso:",
          novoParceiro
        );

        setState((prev) => ({
          ...prev,
          parceiros: [...prev.parceiros, novoParceiro],
          creating: false,
        }));

        adicionarAtividade(
          "Admin User",
          `Criou novo parceiro ${
            novoParceiro.pessoaFisica?.nome || novoParceiro.id
          }`,
          "success",
          `OAB: ${novoParceiro.oab || "Não informado"}`,
          "Parceiros"
        );

        // Recarregar lista para sincronizar com backend
        await fetchParceiros();
        return novoParceiro;
      } catch (error: any) {
        console.error("🔧 createParceiro: Erro ao criar parceiro:", error);

        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.title ||
          error.message ||
          "Erro desconhecido ao criar parceiro";

        setState((prev) => ({
          ...prev,
          error: errorMessage,
          creating: false,
        }));

        throw new Error(errorMessage);
      }
    },
    [fetchParceiros, adicionarAtividade]
  );

  const updateParceiro = useCallback(
    async (id: number, data: Partial<UpdateParceiroDTO>) => {
      setState((prev) => ({ ...prev, updating: true, error: null }));
      try {
        const response = await apiClient.put(`/Parceiro/${id}`, data);

        // Para updates, o backend pode retornar NoContent (204)
        let parceiroAtualizado: Parceiro;
        if (response.data) {
          parceiroAtualizado = response.data as Parceiro;
        } else {
          // Se não retornou dados, buscar o parceiro atualizado
          parceiroAtualizado = await getParceiro(id);
        }

        setState((prev) => ({
          ...prev,
          parceiros: prev.parceiros.map((parceiro) =>
            parceiro.id === id ? parceiroAtualizado : parceiro
          ),
          updating: false,
        }));

        adicionarAtividade(
          "Admin User",
          `Atualizou parceiro #${id}`,
          "info",
          "",
          "Parceiros"
        );

        await fetchParceiros();
        return parceiroAtualizado;
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          error: error.response?.data?.message || "Erro ao atualizar parceiro",
          updating: false,
        }));
        throw error;
      }
    },
    [fetchParceiros, adicionarAtividade, getParceiro]
  );

  const deleteParceiro = useCallback(
    async (id: number) => {
      console.log(
        "🔧 deleteParceiro: Iniciando exclusão do parceiro ID:",
        id,
        "Tipo:",
        typeof id
      );

      // Validação do ID
      if (id === undefined || id === null || isNaN(id)) {
        console.error("🔧 deleteParceiro: ID inválido recebido:", id);
        throw new Error(`ID inválido para exclusão: ${id}`);
      }

      setState((prev) => ({ ...prev, deleting: true, error: null }));
      try {
        console.log(
          "🔧 deleteParceiro: Chamando API para excluir parceiro ID:",
          id
        );
        const response = await apiClient.delete(`/Parceiro/${id}`);
        console.log("🔧 deleteParceiro: Resposta da API:", response.data);

        setState((prev) => ({
          ...prev,
          parceiros: prev.parceiros.filter((parceiro) => parceiro.id !== id),
          deleting: false,
        }));

        adicionarAtividade(
          "Admin User",
          `Excluiu parceiro #${id}`,
          "warning",
          "",
          "Parceiros"
        );

        await fetchParceiros();
        return true;
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          error: error.response?.data?.message || "Erro ao excluir parceiro",
          deleting: false,
        }));
        throw error;
      }
    },
    [fetchParceiros, adicionarAtividade]
  );

  const getParceirosPorFilial = useCallback(async (filialId: number) => {
    try {
      const response = await apiClient.get(`/Parceiro/por-filial/${filialId}`);
      return response.data as Parceiro[];
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Erro ao buscar parceiros da filial"
      );
    }
  }, []);

  const getResponsaveisTecnicos = useCallback(async () => {
    try {
      const response = await apiClient.get("/Parceiro/responsaveis-tecnicos");
      return response.data as Array<{
        id: number;
        pessoaFisicaId: number;
        nome: string;
        oab?: string;
      }>;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Erro ao buscar responsáveis técnicos"
      );
    }
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  useEffect(() => {
    console.log(
      "🔧 useParceiros: useEffect - Carregando parceiros na inicialização"
    );
    fetchParceiros();
  }, [fetchParceiros]);

  return {
    parceiros: state.parceiros,
    loading: state.loading,
    error: state.error,
    creating: state.creating,
    updating: state.updating,
    deleting: state.deleting,
    fetchParceiros,
    getParceiro,
    createParceiro,
    updateParceiro,
    deleteParceiro,
    getParceirosPorFilial,
    getResponsaveisTecnicos,
    clearError,
  };
}
