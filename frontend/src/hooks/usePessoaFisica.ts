// src/hooks/usePessoaFisica.ts
import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";
import {
  PessoaFisica,
  CreatePessoaFisicaDTO,
  UpdatePessoaFisicaDTO,
  ResponsavelTecnicoOption,
} from "@/types/api";
import { useAtividadeContext } from "@/contexts/AtividadeContext";

interface UsePessoaFisicaState {
  pessoas: PessoaFisica[];
  loading: boolean;
  error: string | null;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
}

export function usePessoaFisica() {
  const [state, setState] = useState<UsePessoaFisicaState>({
    pessoas: [],
    loading: false,
    error: null,
    creating: false,
    updating: false,
    deleting: false,
  });

  const { adicionarAtividade } = useAtividadeContext();

  const setLoading = (loading: boolean) => {
    setState((prev) => ({ ...prev, loading }));
  };

  const setError = (error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  };

  const setPessoas = (pessoas: PessoaFisica[]) => {
    setState((prev) => ({ ...prev, pessoas }));
  };

  // Listar todas as pessoas físicas
  const fetchPessoas = useCallback(async () => {
    console.log("🔄 Iniciando fetchPessoas");
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<PessoaFisica[]>("/PessoaFisica");
      console.log("📡 Resposta fetchPessoas:", response);

      if (response.error) {
        console.error("❌ Erro em fetchPessoas:", response.error);
        setError(response.error);
      } else if (!response.data) {
        console.warn("⚠️ fetchPessoas: dados vazios ou nulos");
        setPessoas([]);
      } else {
        console.log(
          "✅ fetchPessoas bem-sucedido, dados:",
          response.data.length
        );
        setPessoas(response.data);
      }
    } catch (error) {
      console.error("💥 Erro em fetchPessoas:", error);
      setError("Erro ao carregar pessoas físicas");
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar pessoa física por ID
  const fetchPessoaById = useCallback(
    async (id: number): Promise<PessoaFisica | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.get<PessoaFisica>(
          `/PessoaFisica/${id}`
        );

        if (response.error) {
          setError(response.error);
          return null;
        }

        return response.data || null;
      } catch (error) {
        setError("Erro ao carregar pessoa física");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchPessoas]
  );

  // Criar nova pessoa física
  const createPessoa = useCallback(
    async (data: CreatePessoaFisicaDTO): Promise<boolean> => {
      setState((prev) => ({ ...prev, creating: true, error: null }));

      try {
        const response = await apiClient.post<PessoaFisica>(
          "/PessoaFisica",
          data
        );

        if (response.error) {
          setError(response.error);
          return false;
        }

        // Recarregar a lista após criar
        await fetchPessoas();

        // Registrar atividade
        adicionarAtividade(
          "Admin User",
          `Cadastrou nova pessoa física: ${data.nome}`,
          "success",
          `CPF: ${data.cpf || "Não informado"}`,
          "Pessoa Física"
        );

        return true;
      } catch (error) {
        setError("Erro ao criar pessoa física");
        return false;
      } finally {
        setState((prev) => ({ ...prev, creating: false }));
      }
    },
    [fetchPessoas, adicionarAtividade]
  );

  // Atualizar pessoa física
  const updatePessoa = useCallback(
    async (id: number, data: UpdatePessoaFisicaDTO): Promise<boolean> => {
      setState((prev) => ({ ...prev, updating: true, error: null }));

      try {
        const response = await apiClient.put(`/PessoaFisica/${id}`, data);

        if (response.error) {
          setError(response.error);
          return false;
        }

        // Recarregar a lista após atualizar
        await fetchPessoas();

        // Registrar atividade
        adicionarAtividade(
          "Admin User",
          `Atualizou pessoa física: ${data.nome}`,
          "info",
          `Email: ${data.email || "Não informado"}`,
          "Pessoa Física"
        );

        return true;
      } catch (error) {
        setError("Erro ao atualizar pessoa física");
        return false;
      } finally {
        setState((prev) => ({ ...prev, updating: false }));
      }
    },
    [fetchPessoas, adicionarAtividade]
  );

  // Deletar pessoa física
  const deletePessoa = useCallback(
    async (id: number): Promise<boolean> => {
      console.log("🗑️ Iniciando exclusão da pessoa física ID:", id);
      setState((prev) => ({ ...prev, deleting: true, error: null }));

      try {
        const response = await apiClient.delete(`/PessoaFisica/${id}`);
        console.log("📡 Resposta da API:", response);

        if (response.error) {
          console.error(
            "❌ Erro na exclusão:",
            response.error,
            "Status:",
            response.status
          );
          // Se for erro 400, pode ser uma validação de negócio (ex: responsável técnico)
          if (response.status === 400) {
            setError(response.error);
          } else {
            setError("Erro ao excluir pessoa física");
          }
          return false;
        }

        console.log("✅ Exclusão bem-sucedida, recarregando lista...");

        // Encontrar a pessoa antes de recarregar para registrar atividade
        const pessoaParaDeletar = state.pessoas.find((p) => p.id === id);

        // Recarregar a lista após deletar
        try {
          await fetchPessoas();
          console.log("✅ Lista recarregada com sucesso");
        } catch (fetchError) {
          console.error("❌ Erro ao recarregar lista:", fetchError);
          setError("Pessoa excluída, mas erro ao atualizar lista");
        }

        // Registrar atividade
        if (pessoaParaDeletar) {
          adicionarAtividade(
            "Admin User",
            `Excluiu pessoa física: ${pessoaParaDeletar.nome}`,
            "warning",
            `CPF: ${pessoaParaDeletar.cpf || "Não informado"}`,
            "Pessoa Física"
          );
        }

        return true;
      } catch (error) {
        console.error("💥 Erro na exclusão:", error);
        setError("Erro ao deletar pessoa física");
        return false;
      } finally {
        setState((prev) => ({ ...prev, deleting: false }));
      }
    },
    [fetchPessoas, state.pessoas, adicionarAtividade]
  );

  // Buscar responsáveis técnicos para select
  const fetchResponsaveisTecnicos = useCallback(async (): Promise<
    ResponsavelTecnicoOption[]
  > => {
    try {
      const response = await apiClient.get<ResponsavelTecnicoOption[]>(
        "/PessoaFisica/responsaveis-tecnicos"
      );

      if (response.error) {
        console.error(
          "Erro ao carregar responsáveis técnicos:",
          response.error
        );
        return [];
      }

      return response.data || [];
    } catch (error) {
      console.error("Erro ao carregar responsáveis técnicos:", error);
      return [];
    }
  }, []);

  // Carregar dados iniciais
  useEffect(() => {
    fetchPessoas();
  }, []); // Remover fetchPessoas da dependência para evitar loops

  return {
    ...state,
    fetchPessoas,
    fetchPessoaById,
    createPessoa,
    updatePessoa,
    deletePessoa,
    fetchResponsaveisTecnicos,
    clearError: () => setError(null),
  };
}
