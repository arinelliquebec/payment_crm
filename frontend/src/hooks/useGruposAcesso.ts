import { useState, useEffect, useCallback } from "react";
import {
  grupoAcessoService,
  GrupoAcesso,
  GrupoAcessoOption,
} from "@/services/grupoAcesso.service";

/**
 * Hook para obter grupos de acesso
 */
export function useGruposAcesso() {
  const [grupos, setGrupos] = useState<GrupoAcesso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGrupos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const gruposData = await grupoAcessoService.getGruposAcesso();
      setGrupos(gruposData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar grupos de acesso"
      );
      setGrupos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGrupos();
  }, [fetchGrupos]);

  const refresh = useCallback(() => {
    grupoAcessoService.invalidateCache();
    fetchGrupos();
  }, [fetchGrupos]);

  return {
    grupos,
    loading,
    error,
    refresh,
  };
}

/**
 * Hook para obter opções de grupos de acesso para select
 */
export function useGruposAcessoOptions() {
  const [options, setOptions] = useState<GrupoAcessoOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOptions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const optionsData = await grupoAcessoService.getGruposAcessoOptions();
      setOptions(optionsData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar opções de grupos"
      );
      // Usar opções padrão em caso de erro
      setOptions(grupoAcessoService.getDefaultOptions());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  const refresh = useCallback(() => {
    grupoAcessoService.invalidateCache();
    fetchOptions();
  }, [fetchOptions]);

  return {
    options,
    loading,
    error,
    refresh,
  };
}

/**
 * Hook para obter um grupo de acesso específico
 */
export function useGrupoAcesso(id: number) {
  const [grupo, setGrupo] = useState<GrupoAcesso | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGrupo = async () => {
      try {
        setLoading(true);
        setError(null);
        const grupoData = await grupoAcessoService.getGrupoAcessoById(id);
        setGrupo(grupoData);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Erro ao carregar grupo de acesso"
        );
        setGrupo(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchGrupo();
    } else {
      setGrupo(null);
      setLoading(false);
    }
  }, [id]);

  return {
    grupo,
    loading,
    error,
  };
}

/**
 * Hook para obter um grupo de acesso por nome
 */
export function useGrupoAcessoByNome(nome: string) {
  const [grupo, setGrupo] = useState<GrupoAcesso | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGrupo = async () => {
      try {
        setLoading(true);
        setError(null);
        const grupoData = await grupoAcessoService.getGrupoAcessoByNome(nome);
        setGrupo(grupoData);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Erro ao carregar grupo de acesso"
        );
        setGrupo(null);
      } finally {
        setLoading(false);
      }
    };

    if (nome) {
      fetchGrupo();
    } else {
      setGrupo(null);
      setLoading(false);
    }
  }, [nome]);

  return {
    grupo,
    loading,
    error,
  };
}
