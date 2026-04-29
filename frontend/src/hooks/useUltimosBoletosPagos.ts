// src/hooks/useUltimosBoletosPagos.ts
"use client";
import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";

export interface UltimoBoletoPago {
  Id: number;
  NsuCode: string;
  BankNumber: string;
  ClientNumber: string;
  NominalValue: number;
  DueDate: string;
  IssueDate: string;
  Status: string;
  DataLiquidado: string | null;
  DataCadastro: string;
  FoiPago: boolean;
  BarCode: string;
  DigitableLine: string;
  Cliente: {
    Id: number;
    Nome: string;
    Tipo: "PF" | "PJ";
  };
  Contrato: {
    Id: number;
    NumeroPasta: string | null;
  };
}

export interface UltimosBoletosPagosResponse {
  UltimosBoletosPagos: UltimoBoletoPago[];
  Total: number;
  DataAtualizacao: string;
}

interface UseUltimosBoletosPagosState {
  boletos: UltimoBoletoPago[];
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
}

export function useUltimosBoletosPagos(
  autoRefresh = true,
  refreshInterval = 30000
) {
  const [state, setState] = useState<UseUltimosBoletosPagosState>({
    boletos: [],
    loading: true,
    error: null,
    lastUpdate: null,
  });

  const fetchUltimosBoletos = useCallback(async () => {
    try {
      console.log("🔧 fetchUltimosBoletos: Buscando últimos boletos pagos...");
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const response = await apiClient.get(
        "/Estatisticas/ultimos-boletos-pagos"
      );

      if (response.error) {
        throw new Error(response.error);
      }

      const data = response.data as UltimosBoletosPagosResponse;
      console.log("📊 fetchUltimosBoletos: Dados recebidos:", data);

      setState({
        boletos: data.UltimosBoletosPagos || [],
        loading: false,
        error: null,
        lastUpdate: new Date(),
      });

      console.log(
        "✅ fetchUltimosBoletos: Últimos boletos pagos carregados com sucesso"
      );
    } catch (err: any) {
      console.error(
        "❌ fetchUltimosBoletos: Erro ao buscar últimos boletos pagos:",
        err
      );
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err.message || "Erro ao carregar últimos boletos pagos",
      }));
    }
  }, []);

  // Carregar dados automaticamente na montagem
  useEffect(() => {
    console.log("🚀 useUltimosBoletosPagos: Carregando dados iniciais...");
    fetchUltimosBoletos();
  }, [fetchUltimosBoletos]);

  // Auto-refresh se habilitado
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      console.log("🔄 useUltimosBoletosPagos: Auto-refresh...");
      fetchUltimosBoletos();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchUltimosBoletos]);

  const refresh = useCallback(() => {
    console.log("🔄 useUltimosBoletosPagos: Refresh manual...");
    fetchUltimosBoletos();
  }, [fetchUltimosBoletos]);

  return {
    boletos: state.boletos,
    loading: state.loading,
    error: state.error,
    lastUpdate: state.lastUpdate,
    refresh,
    hasData: state.boletos.length > 0,
  };
}
