// src/hooks/useEstatisticas.ts
"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { apiClient } from "@/lib/api";

export interface ReceitaData {
  receitaTotal: number; // Valor dos boletos liquidados (dinheiro que entrou)
  receitaEntrada: number;
  receitaParcelas: number;
  comissaoTotal: number;
  lucroContratos?: number; // Lucro teórico dos contratos (ValorNegociado - Comissão)
  receitaMesAtual: number;
  receitaAnoAtual: number;
  crescimentoMes: number;
  valorTotalBoletos: number;
  valorBoletosLiquidados: number;
  valorBoletosPendentes: number;
  valorBoletosVencidos: number;
  totalContratos: number;
  contratosFechados: number;
  contratosMesAtual: number;
  contratosAnoAtual: number;
  boletosMesAtual: number;
  boletosAnoAtual: number;
  valorBoletosMesAtual: number;
  valorBoletosAnoAtual: number;
  taxaConversao: number;
  receitaMediaPorContrato: number;
  contratosPorSituacao: {
    leed: number;
    prospecto: number;
    enviado: number;
    assinado: number;
  };
}

export interface DashboardData {
  Contratos: {
    TotalContratos: number;
    ContratosMesAtual: number;
    ReceitaTotal: number;
    ReceitaMesAtual: number;
    ContratosFechados: number;
    ContratosPendentes: number;
  };
  Boletos: {
    TotalBoletos: number;
    BoletosLiquidados: number;
    ValorLiquidado: number;
    ValorPendente: number;
  };
  DataAtualizacao: string;
}

interface UseEstatisticasState {
  receita: ReceitaData | null;
  dashboard: DashboardData | null;
  loading: boolean;
  error: string | null;
}

export function useEstatisticas() {
  const [receita, setReceita] = useState<ReceitaData | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const fetchReceita = useCallback(async () => {
    try {
      console.log("🔧 fetchReceita: Buscando dados de receita...");
      const response = await apiClient.get("/Estatisticas/receita");

      if (response.error) {
        throw new Error(response.error);
      }

      console.log("📊 fetchReceita: Dados recebidos:", response.data);
      console.log("📊 fetchReceita: receitaTotal =", (response.data as any)?.receitaTotal);

      setReceita(response.data as ReceitaData);
      console.log("✅ fetchReceita: Dados de receita carregados com sucesso");
    } catch (err: any) {
      console.error("❌ fetchReceita: Erro ao buscar receita:", err);
      setError(err.message || "Erro ao carregar dados de receita");
    }
  }, []);

  const fetchDashboard = useCallback(async () => {
    try {
      console.log("🔧 fetchDashboard: Buscando dados do dashboard...");
      const response = await apiClient.get("/Estatisticas/dashboard");

      if (response.error) {
        throw new Error(response.error);
      }

      setDashboard(response.data as DashboardData);
      console.log("✅ fetchDashboard: Dados do dashboard carregados com sucesso");
    } catch (err: any) {
      console.error("❌ fetchDashboard: Erro ao buscar dashboard:", err);
      setError(err.message || "Erro ao carregar dados do dashboard");
    }
  }, []);

  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    await Promise.all([fetchReceita(), fetchDashboard()]);
    setLoading(false);
  }, [fetchReceita, fetchDashboard]);

  // Carregar dados automaticamente na montagem
  useEffect(() => {
    console.log("🚀 useEstatisticas: useEffect executando, hasFetched =", hasFetched.current);
    if (!hasFetched.current) {
      hasFetched.current = true;
      console.log("🚀 useEstatisticas: Iniciando fetch de dados...");
      refreshData();
    }
  }, [refreshData]);

  return {
    receita,
    dashboard,
    loading,
    error,
    fetchReceita,
    fetchDashboard,
    refreshData,
  };
}
