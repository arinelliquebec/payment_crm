import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";

export interface ClienteRisco {
  clienteId: number;
  nomeCliente: string;
  documento: string;
  tipoPessoa: string;
  scoreRisco: number;
  nivelRisco: string;
  corRisco: string;
  totalBoletos: number;
  boletosAtrasados: number;
  boletosPagos: number;
  valorTotalDevido: number;
  valorEmAtraso: number;
  diasAtrasoMedio: number;
  ultimoPagamento: string | null;
  fatoresRisco: string[];
}

export interface ResumoRisco {
  totalClientesAnalisados: number;
  clientesAltoRisco: number;
  clientesMedioRisco: number;
  clientesBaixoRisco: number;
  valorTotalEmRisco: number;
  top5ClientesRisco: ClienteRisco[];
  dataAnalise: string;
}

export function useRiscoInadimplencia() {
  const [resumo, setResumo] = useState<ResumoRisco | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResumo = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<ResumoRisco>("/AnaliseRisco/resumo");
      if (response.data) {
        setResumo(response.data);
      }
    } catch (err) {
      console.error("Erro ao buscar resumo de risco:", err);
      setError("Erro ao carregar análise de risco");
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
