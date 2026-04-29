import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";

export interface Lead {
  id: number;
  nomeEmpresa: string;
  status: string;
  valorEstimado: number;
  probabilidade: number | null;
  origem: string | null;
  contatoNome: string | null;
  contatoTelefone: string | null;
  contatoEmail: string | null;
  contatoCargo: string | null;
  necessidade: string | null;
  observacoes: string | null;
  responsavelId: number | null;
  responsavelNome: string | null;
  dataCriacao: string;
  dataUltimaInteracao: string | null;
  dataProximaAcao: string | null;
  proximaAcao: string | null;
  dataQualificacao: string | null;
  dataProposta: string | null;
  dataNegociacao: string | null;
  dataFechamento: string | null;
  motivoPerda: string | null;
  clienteId: number | null;
  contratoId: number | null;
  totalInteracoes: number;
  criadoPorNome: string | null;
}

export interface LeadInteracao {
  id: number;
  leadId: number;
  tipo: string;
  descricao: string;
  dataInteracao: string;
  usuarioNome: string | null;
  duracaoMinutos: number | null;
}

export interface PipelineStats {
  totalLeads: number;
  valorTotal: number;
  valorPrevisto: number;
  taxaConversao: number;
  tempoMedioCiclo: number;
  leadsPorStatus: Record<string, number>;
  valorPorStatus: Record<string, number>;
  leadsPorOrigem: Record<string, number>;
  taxaConversaoPorOrigem: Record<string, number>;
  leadsUrgentes: Lead[];
}

export const useLeads = (autoRefresh = false, refreshInterval = 30000) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(
    async (responsavelId?: number, status?: string, origem?: string) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (responsavelId)
          params.append("responsavelId", responsavelId.toString());
        if (status) params.append("status", status);
        if (origem) params.append("origem", origem);

        const response = await apiClient.get(`/Lead?${params.toString()}`);
        const leadsData = (response.data || []) as Lead[];
        setLeads(leadsData);
        return leadsData;
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || "Erro ao buscar leads";
        setError(errorMsg);
        console.error("Erro ao buscar leads:", err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getLead = useCallback(async (id: number) => {
    try {
      const response = await apiClient.get(`/Lead/${id}`);
      return response.data;
    } catch (err: any) {
      console.error("Erro ao buscar lead:", err);
      throw err;
    }
  }, []);

  const createLead = useCallback(
    async (data: {
      nomeEmpresa: string;
      valorEstimado: number;
      origem?: string;
      contatoNome?: string;
      contatoTelefone?: string;
      contatoEmail?: string;
      contatoCargo?: string;
      necessidade?: string;
      observacoes?: string;
      responsavelId?: number;
      probabilidade?: number;
    }) => {
      try {
        const response = await apiClient.post("/Lead", data);
        await fetchLeads();
        return response.data;
      } catch (err: any) {
        console.error("Erro ao criar lead:", err);
        throw err;
      }
    },
    [fetchLeads]
  );

  const updateLead = useCallback(
    async (id: number, data: Partial<Lead>) => {
      try {
        const response = await apiClient.put(`/Lead/${id}`, data);
        await fetchLeads();
        return response.data;
      } catch (err: any) {
        console.error("Erro ao atualizar lead:", err);
        throw err;
      }
    },
    [fetchLeads]
  );

  const updateLeadStatus = useCallback(
    async (id: number, status: string, motivoPerda?: string) => {
      try {
        const response = await apiClient.put(`/Lead/${id}/status`, {
          status,
          motivoPerda,
        });
        await fetchLeads();
        return response.data;
      } catch (err: any) {
        console.error("Erro ao atualizar status do lead:", err);
        throw err;
      }
    },
    [fetchLeads]
  );

  const deleteLead = useCallback(
    async (id: number) => {
      try {
        await apiClient.delete(`/Lead/${id}`);
        await fetchLeads();
      } catch (err: any) {
        console.error("Erro ao deletar lead:", err);
        throw err;
      }
    },
    [fetchLeads]
  );

  const getLeadInteracoes = useCallback(async (leadId: number) => {
    try {
      const response = await apiClient.get(`/Lead/${leadId}/interacoes`);
      return response.data;
    } catch (err: any) {
      console.error("Erro ao buscar interações:", err);
      throw err;
    }
  }, []);

  const addInteracao = useCallback(
    async (
      leadId: number,
      data: {
        tipo: string;
        descricao: string;
        duracaoMinutos?: number;
      }
    ) => {
      try {
        const response = await apiClient.post(
          `/Lead/${leadId}/interacoes`,
          data
        );
        return response.data;
      } catch (err: any) {
        console.error("Erro ao adicionar interação:", err);
        throw err;
      }
    },
    []
  );

  const getPipelineStats = useCallback(async (responsavelId?: number) => {
    try {
      const params = responsavelId ? `?responsavelId=${responsavelId}` : "";
      const response = await apiClient.get(`/Lead/stats${params}`);
      return response.data as PipelineStats;
    } catch (err: any) {
      console.error("Erro ao buscar estatísticas:", err);
      throw err;
    }
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchLeads();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, fetchLeads]);

  return {
    leads,
    loading,
    error,
    fetchLeads,
    getLead,
    createLead,
    updateLead,
    updateLeadStatus,
    deleteLead,
    getLeadInteracoes,
    addInteracao,
    getPipelineStats,
  };
};
