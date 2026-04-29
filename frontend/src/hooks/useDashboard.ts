// src/hooks/useDashboard.ts
import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";
import { retryOperation } from "@/hooks/useRetry";
import { PessoaFisica, PessoaJuridica, Usuario } from "@/types/api";
import { getApiUrl } from "../../env.config";

interface DashboardStats {
  totalPessoasFisicas: number;
  totalPessoasJuridicas: number;
  totalUsuarios: number;
}

interface UseDashboardState {
  stats: DashboardStats;
  loading: boolean;
  error: string | null;
}

export function useDashboard() {
  const [state, setState] = useState<UseDashboardState>({
    stats: {
      totalPessoasFisicas: 0,
      totalPessoasJuridicas: 0,
      totalUsuarios: 0,
    },
    loading: false,
    error: null,
  });

  const setLoading = (loading: boolean) => {
    setState((prev) => ({ ...prev, loading }));
  };

  const setError = (error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  };

  const setStats = (stats: DashboardStats) => {
    setState((prev) => ({ ...prev, stats }));
  };

  // Calcular estatísticas usando endpoints otimizados de contagem
  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log(
        "📊 useDashboard: Buscando estatísticas otimizadas (apenas contadores)"
      );

      // Fazer requisições paralelas para contadores otimizados com retry
      const [
        countPessoasFisicasResponse,
        countPessoasJuridicasResponse,
        countUsuariosResponse,
      ] = await Promise.all([
        retryOperation(() => apiClient.get<number>("/PessoaFisica/count"), {
          maxAttempts: 2,
          delay: 500,
        }),
        retryOperation(() => apiClient.get<number>("/PessoaJuridica/count"), {
          maxAttempts: 2,
          delay: 500,
        }),
        retryOperation(() => apiClient.get<number>("/Usuario/count"), {
          maxAttempts: 2,
          delay: 500,
        }),
      ]);

      // Verificar se há erros
      if (countPessoasFisicasResponse.error) {
        console.error(
          "❌ Erro em PessoasFisicas/count:",
          countPessoasFisicasResponse.error
        );
        throw new Error(
          `Erro ao contar pessoas físicas: ${countPessoasFisicasResponse.error}`
        );
      }
      if (countPessoasJuridicasResponse.error) {
        console.error(
          "❌ Erro em PessoasJuridicas/count:",
          countPessoasJuridicasResponse.error
        );
        throw new Error(
          `Erro ao contar pessoas jurídicas: ${countPessoasJuridicasResponse.error}`
        );
      }
      if (countUsuariosResponse.error) {
        console.error(
          "❌ Erro em Usuarios/count:",
          countUsuariosResponse.error
        );
        throw new Error(
          `Erro ao contar usuários: ${countUsuariosResponse.error}`
        );
      }

      // Obter os valores dos contadores
      const totalPessoasFisicas = countPessoasFisicasResponse.data || 0;
      const totalPessoasJuridicas = countPessoasJuridicasResponse.data || 0;
      const totalUsuarios = countUsuariosResponse.data || 0;

      const stats: DashboardStats = {
        totalPessoasFisicas,
        totalPessoasJuridicas,
        totalUsuarios,
      };

      console.log(
        "✅ useDashboard: Estatísticas carregadas com sucesso:",
        stats
      );
      setStats(stats);
    } catch (error) {
      console.error("❌ useDashboard: Erro capturado:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erro ao carregar estatísticas";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregar estatísticas iniciais
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    ...state,
    fetchStats,
    clearError: () => setError(null),
  };
}
