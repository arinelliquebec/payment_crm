import { useState, useEffect, useCallback } from "react";

// Tipos
export interface ContratoPortal {
  id: number;
  numeroPasta: string;
  tipoServico: string;
  situacao: string;
  valorTotal: number;
  valorPago: number;
  dataInicio: string;
  consultorNome: string;
  consultorId?: number;
  proximoVencimento?: string;
  observacoes?: string;
  pendencias?: string;
}

export interface PagamentoPortal {
  id: number;
  contratoId: number;
  contratoNumero: string;
  valor: number;
  dataVencimento: string;
  dataPagamento?: string;
  status: "pago" | "pendente" | "vencido";
  tipo: string;
  codigoBarras?: string;
  linkBoleto?: string;
}

export interface ResumoPortal {
  totalContratos: number;
  contratosAtivos: number;
  valorTotalContratos: number;
  valorTotalPago: number;
  boletosPendentes: number;
  boletosVencidos: number;
  proximoPagamento: PagamentoPortal | null;
}

export interface PortalClienteData {
  contratos: ContratoPortal[];
  pagamentos: PagamentoPortal[];
  resumo: ResumoPortal;
}

interface UsePortalClienteDataReturn {
  data: PortalClienteData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePortalClienteData(clienteId: number | null): UsePortalClienteDataReturn {
  const [data, setData] = useState<PortalClienteData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!clienteId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/portal-cliente/dados?clienteId=${clienteId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao carregar dados");
      }

      const result = await response.json();
      setData(result);
    } catch (err: any) {
      console.error("Erro ao buscar dados do portal:", err);
      setError(err.message || "Erro ao carregar dados do portal");
    } finally {
      setIsLoading(false);
    }
  }, [clienteId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}

