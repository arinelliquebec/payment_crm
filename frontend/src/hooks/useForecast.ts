import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";

export interface ForecastResumo {
  receitaMesPassado: number;
  receitaEsperadaMesAtual: number;
  receitaEsperadaProximoMes: number;
  receitaEsperadaTrimestre: number;
  receitaPipelineEstimada: number;
  mediaReceitaMensal: number;
  taxaConversaoHistorica: number;
  totalBoletosAVencer: number;
  totalContratosEmNegociacao: number;
  dataAnalise: string;
}

export interface ForecastMensal {
  mes: number;
  ano: number;
  nomeMes: string;
  receitaConfirmada: number;
  receitaProjetada: number;
  quantidadeBoletos: number;
  tendencia: number;
  confiabilidade: string;
}

export interface PipelineEtapa {
  etapa: string;
  quantidade: number;
  valorTotal: number;
  valorPonderado: number;
  probabilidade: number;
  cor: string;
}

export interface ForecastPipeline {
  etapas: PipelineEtapa[];
  valorTotalPipeline: number;
  valorPonderadoTotal: number;
  totalContratos: number;
}

export interface ForecastBoleto {
  boletoId: number;
  contratoId: number;
  nomeCliente: string;
  valor: number;
  dataVencimento: string;
  diasParaVencer: number;
  status: string;
}

export function useForecast() {
  const [resumo, setResumo] = useState<ForecastResumo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResumo = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<ForecastResumo>("/Forecast/resumo");
      if (response.data) {
        setResumo(response.data);
      }
    } catch (err) {
      console.error("Erro ao buscar forecast:", err);
      setError("Erro ao carregar previsão de receita");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumo();
  }, []);

  return {
    resumo,
    loading,
    error,
    refetch: fetchResumo,
  };
}

export function useForecastMensal(meses: number = 12) {
  const [dados, setDados] = useState<ForecastMensal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDados = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<ForecastMensal[]>(
        `/Forecast/mensal?meses=${meses}`
      );
      if (response.data) {
        setDados(response.data);
      }
    } catch (err) {
      console.error("Erro ao buscar forecast mensal:", err);
      setError("Erro ao carregar previsão mensal");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDados();
  }, [meses]);

  return {
    dados,
    loading,
    error,
    refetch: fetchDados,
  };
}

export function useForecastPipeline() {
  const [pipeline, setPipeline] = useState<ForecastPipeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPipeline = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<ForecastPipeline>(
        "/Forecast/pipeline"
      );
      if (response.data) {
        setPipeline(response.data);
      }
    } catch (err) {
      console.error("Erro ao buscar pipeline:", err);
      setError("Erro ao carregar pipeline");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipeline();
  }, []);

  return {
    pipeline,
    loading,
    error,
    refetch: fetchPipeline,
  };
}

export function useBoletosAVencer(dias: number = 90) {
  const [boletos, setBoletos] = useState<ForecastBoleto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBoletos = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<ForecastBoleto[]>(
        `/Forecast/boletos-a-vencer?dias=${dias}`
      );
      if (response.data) {
        setBoletos(response.data);
      }
    } catch (err) {
      console.error("Erro ao buscar boletos:", err);
      setError("Erro ao carregar boletos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoletos();
  }, [dias]);

  return {
    boletos,
    loading,
    error,
    refetch: fetchBoletos,
  };
}
