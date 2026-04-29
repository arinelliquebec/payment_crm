// src/hooks/useUsuario.ts
import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";
import {
  Usuario,
  CreateUsuarioDTO,
  UpdateUsuarioDTO,
  PessoaFisicaOption,
  PessoaJuridicaOption,
} from "@/types/api";
import { useAtividadeContext } from "@/contexts/AtividadeContext";
import { useAuth } from "@/contexts/AuthContext";

interface UseUsuarioState {
  usuarios: Usuario[];
  loading: boolean;
  error: string | null;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
}

export function useUsuario() {
  const [state, setState] = useState<UseUsuarioState>({
    usuarios: [],
    loading: false,
    error: null,
    creating: false,
    updating: false,
    deleting: false,
  });

  const { adicionarAtividade } = useAtividadeContext();
  const { user } = useAuth();

  const setLoading = (loading: boolean) => {
    setState((prev) => ({ ...prev, loading }));
  };

  const setError = (error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  };

  const setUsuarios = (usuarios: Usuario[]) => {
    setState((prev) => ({ ...prev, usuarios }));
  };

  // Listar todos os usuários
  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<Usuario[]>("/Usuario");

      if (response.error) {
        setError(response.error);
      } else {
        setUsuarios(response.data || []);
      }
    } catch (error) {
      setError("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar usuário por ID
  const fetchUsuarioById = useCallback(
    async (id: number): Promise<Usuario | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.get<Usuario>(`/Usuario/${id}`);

        if (response.error) {
          setError(response.error);
          return null;
        }

        return response.data || null;
      } catch (error) {
        setError("Erro ao carregar usuário");
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Buscar pessoas físicas para select
  const fetchPessoasFisicas = useCallback(async (): Promise<
    PessoaFisicaOption[]
  > => {
    try {
      const response = await apiClient.get<PessoaFisicaOption[]>(
        "/Usuario/pessoas-fisicas"
      );

      if (response.error) {
        console.error("Erro ao carregar pessoas físicas:", response.error);
        return [];
      }

      return response.data || [];
    } catch (error) {
      console.error("Erro ao carregar pessoas físicas:", error);
      return [];
    }
  }, []);

  // Buscar pessoas jurídicas para select
  const fetchPessoasJuridicas = useCallback(async (): Promise<
    PessoaJuridicaOption[]
  > => {
    try {
      const response = await apiClient.get<PessoaJuridicaOption[]>(
        "/Usuario/pessoas-juridicas"
      );

      if (response.error) {
        console.error("Erro ao carregar pessoas jurídicas:", response.error);
        return [];
      }

      return response.data || [];
    } catch (error) {
      console.error("Erro ao carregar pessoas jurídicas:", error);
      return [];
    }
  }, []);

  // Criar novo usuário
  const createUsuario = useCallback(
    async (data: CreateUsuarioDTO): Promise<boolean> => {
      setState((prev) => ({ ...prev, creating: true, error: null }));

      try {
        const response = await apiClient.post<Usuario>("/Usuario/create", data);

        if (response.error) {
          setError(response.error);
          return false;
        }

        // Recarregar a lista após criar
        await fetchUsuarios();

        // Registrar atividade
        adicionarAtividade(
          user?.nome || user?.login || "Usuário",
          `Cadastrou novo usuário: ${data.login}`,
          "success",
          `Email: ${data.email}`,
          "Usuários"
        );

        return true;
      } catch (error) {
        setError("Erro ao criar usuário");
        return false;
      } finally {
        setState((prev) => ({ ...prev, creating: false }));
      }
    },
    [fetchUsuarios, adicionarAtividade]
  );

  // Atualizar usuário
  const updateUsuario = useCallback(
    async (id: number, data: UpdateUsuarioDTO): Promise<boolean> => {
      setState((prev) => ({ ...prev, updating: true, error: null }));

      try {
        const response = await apiClient.put(`/Usuario/${id}`, data);

        if (response.error) {
          setError(response.error);
          return false;
        }

        // Recarregar a lista após atualizar
        await fetchUsuarios();

        // Registrar atividade
        adicionarAtividade(
          user?.nome || user?.login || "Usuário",
          `Atualizou usuário: ${data.login}`,
          "info",
          `Tipo: ${
            data.tipoPessoa === "Fisica" ? "Pessoa Física" : "Pessoa Jurídica"
          }`,
          "Usuários"
        );

        return true;
      } catch (error) {
        setError("Erro ao atualizar usuário");
        return false;
      } finally {
        setState((prev) => ({ ...prev, updating: false }));
      }
    },
    [fetchUsuarios, adicionarAtividade]
  );

  // Deletar usuário
  const deleteUsuario = useCallback(
    async (id: number): Promise<boolean> => {
      setState((prev) => ({ ...prev, deleting: true, error: null }));

      try {
        const response = await apiClient.delete(`/Usuario/${id}`);

        if (response.error) {
          setError(response.error);
          return false;
        }

        // Encontrar o usuário antes de recarregar para registrar atividade
        const usuarioParaDeletar = state.usuarios.find((u) => u.id === id);

        // Recarregar a lista após deletar
        await fetchUsuarios();

        // Registrar atividade
        if (usuarioParaDeletar) {
          adicionarAtividade(
            user?.nome || user?.login || "Usuário",
            `Excluiu usuário: ${usuarioParaDeletar.login}`,
            "warning",
            `Email: ${usuarioParaDeletar.email}`,
            "Usuários"
          );
        }

        return true;
      } catch (error) {
        setError("Erro ao deletar usuário");
        return false;
      } finally {
        setState((prev) => ({ ...prev, deleting: false }));
      }
    },
    [fetchUsuarios, state.usuarios, adicionarAtividade]
  );

  // Carregar dados iniciais
  useEffect(() => {
    try {
      fetchUsuarios();
    } catch (error) {
      console.error("Erro ao carregar usuários iniciais:", error);
      setError("Erro ao carregar dados iniciais");
    }
  }, []); // Remover fetchUsuarios da dependência para evitar loops

  return {
    ...state,
    fetchUsuarios,
    fetchUsuarioById,
    fetchPessoasFisicas,
    fetchPessoasJuridicas,
    createUsuario,
    updateUsuario,
    deleteUsuario,
    clearError: () => setError(null),
  };
}
