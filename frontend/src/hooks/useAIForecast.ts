// src/hooks/useAIForecast.ts
import { useState, useEffect, useCallback } from "react";
import {
  aiServiceClient,
  PrevisaoMesSeguinte,
  TendenciaGeral,
  ClientesAlertaResponse,
  ResumoRisco,
  ClienteRisco,
  PrevisaoFaturamentoResponse,
  HistoricoMensalResponse,
} from "@/lib/aiServiceClient";

// Hook para verificar se o AI Service está disponível
export function useAIServiceHealth() {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await aiServiceClient.healthCheck();
        setAvailable(response.status === 200 && response.data?.status === "healthy");
      } catch {
        setAvailable(false);
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
  }, []);

  return { available, loading };
}

// Hook para previsão do próximo mês (widget simples)
export function useAIPrevisaoProximoMes() {
  const [previsao, setPrevisao] = useState<PrevisaoMesSeguinte | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrevisao = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await aiServiceClient.getPrevisaoProximoMes();
      if (response.data) {
        setPrevisao(response.data);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError("Erro ao carregar previsão de IA");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrevisao();
  }, [fetchPrevisao]);

  return { previsao, loading, error, refetch: fetchPrevisao };
}

// Hook para tendência geral
export function useAITendencia() {
  const [tendencia, setTendencia] = useState<TendenciaGeral | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTendencia = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await aiServiceClient.getTendenciaGeral();
      if (response.data) {
        setTendencia(response.data);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError("Erro ao carregar tendência");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTendencia();
  }, [fetchTendencia]);

  return { tendencia, loading, error, refetch: fetchTendencia };
}

// Hook para clientes em alerta (risco)
export function useAIClientesAlerta(limite: number = 5) {
  const [alertas, setAlertas] = useState<ClientesAlertaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlertas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await aiServiceClient.getClientesAlerta(limite);
      if (response.data) {
        setAlertas(response.data);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError("Erro ao carregar alertas");
    } finally {
      setLoading(false);
    }
  }, [limite]);

  useEffect(() => {
    fetchAlertas();
  }, [fetchAlertas]);

  return { alertas, loading, error, refetch: fetchAlertas };
}

// Hook para resumo de risco
export function useAIResumoRisco() {
  const [resumo, setResumo] = useState<ResumoRisco | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResumo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await aiServiceClient.getResumoRisco();
      if (response.data) {
        setResumo(response.data);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError("Erro ao carregar resumo de risco");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResumo();
  }, [fetchResumo]);

  return { resumo, loading, error, refetch: fetchResumo };
}

// Hook para risco de um cliente específico
export function useAIRiscoCliente(clienteId: number | null) {
  const [risco, setRisco] = useState<ClienteRisco | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRisco = useCallback(async () => {
    if (!clienteId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await aiServiceClient.getRiscoCliente(clienteId);
      if (response.data) {
        setRisco(response.data);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError("Erro ao carregar risco do cliente");
    } finally {
      setLoading(false);
    }
  }, [clienteId]);

  useEffect(() => {
    fetchRisco();
  }, [fetchRisco]);

  return { risco, loading, error, refetch: fetchRisco };
}

// Hook para previsão completa de faturamento
export function useAIPrevisaoFaturamento(mesesFuturos: number = 3) {
  const [previsao, setPrevisao] = useState<PrevisaoFaturamentoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrevisao = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await aiServiceClient.getPrevisaoFaturamento(mesesFuturos);
      if (response.data) {
        setPrevisao(response.data);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError("Erro ao carregar previsão de faturamento");
    } finally {
      setLoading(false);
    }
  }, [mesesFuturos]);

  useEffect(() => {
    fetchPrevisao();
  }, [fetchPrevisao]);

  return { previsao, loading, error, refetch: fetchPrevisao };
}

// Hook para histórico mensal
export function useAIHistoricoMensal(meses: number = 6) {
  const [historico, setHistorico] = useState<HistoricoMensalResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistorico = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await aiServiceClient.getHistoricoMensal(meses);
      if (response.data) {
        setHistorico(response.data);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError("Erro ao carregar histórico");
    } finally {
      setLoading(false);
    }
  }, [meses]);

  useEffect(() => {
    fetchHistorico();
  }, [fetchHistorico]);

  return { historico, loading, error, refetch: fetchHistorico };
}

// Hook combinado para o dashboard (carrega tudo de uma vez)
export function useAIDashboard() {
  const [data, setData] = useState<{
    previsao: PrevisaoMesSeguinte | null;
    tendencia: TendenciaGeral | null;
    alertas: ClientesAlertaResponse | null;
    resumoRisco: ResumoRisco | null;
  }>({
    previsao: null,
    tendencia: null,
    alertas: null,
    resumoRisco: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Primeiro verifica se o AI Service está disponível
    const healthResponse = await aiServiceClient.healthCheck();
    if (healthResponse.status !== 200) {
      setAiAvailable(false);
      setLoading(false);
      return;
    }
    setAiAvailable(true);

    try {
      const [previsaoRes, tendenciaRes, alertasRes, resumoRiscoRes] = await Promise.all([
        aiServiceClient.getPrevisaoProximoMes(),
        aiServiceClient.getTendenciaGeral(),
        aiServiceClient.getClientesAlerta(5),
        aiServiceClient.getResumoRisco(),
      ]);

      setData({
        previsao: previsaoRes.data || null,
        tendencia: tendenciaRes.data || null,
        alertas: alertasRes.data || null,
        resumoRisco: resumoRiscoRes.data || null,
      });
    } catch (err) {
      setError("Erro ao carregar dados de IA");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { ...data, loading, error, aiAvailable, refetch: fetchAll };
}
