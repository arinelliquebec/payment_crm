// src/lib/aiServiceClient.ts
import logger from "./logger";
import { getApiUrl } from "../../env.config";

// Usa o BFF/backend existente por padrão. Se houver um AI Service dedicado,
// defina NEXT_PUBLIC_AI_SERVICE_URL para sobrescrever.
const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || getApiUrl();
const AI_SERVICE_API_KEY = process.env.NEXT_PUBLIC_AI_SERVICE_KEY || "sua-chave-secreta-aqui";

export interface AIApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

class AIServiceClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    logger.log("🤖 AIServiceClient: Configurado para", this.baseUrl);
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<AIApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const config: RequestInit = {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-AI-Service-Key": this.apiKey,
          ...options.headers,
        },
        ...options,
      };

      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        logger.error("🤖 AIServiceClient: Erro:", errorText);
        return {
          error: errorText || `HTTP error: ${response.status}`,
          status: response.status,
        };
      }

      const data = await response.json();
      return { data, status: response.status };
    } catch (error) {
      logger.error("🤖 AIServiceClient: Erro de conexão:", error);
      return {
        error: "AI Service não disponível",
        status: 0,
      };
    }
  }

  async get<T>(endpoint: string): Promise<AIApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, data: any): Promise<AIApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Endpoints específicos do AI Service

  // Previsão para o próximo mês
  async getPrevisaoProximoMes() {
    return this.get<PrevisaoMesSeguinte>("/Forecast/resumo");
  }

  // Tendência geral
  async getTendenciaGeral() {
    return this.get<TendenciaGeral>("/Forecast/resumo");
  }

  // Histórico mensal
  async getHistoricoMensal(meses: number = 6) {
    return this.get<HistoricoMensalResponse>(`/Forecast/mensal?meses=${meses}`);
  }

  // Previsão de faturamento completa
  async getPrevisaoFaturamento(mesesFuturos: number = 3) {
    return this.get<PrevisaoFaturamentoResponse>(`/Forecast/mensal?meses=${mesesFuturos}`);
  }

  // Risco de um cliente específico
  async getRiscoCliente(clienteId: number) {
    return this.get<ClienteRisco>(`/AnaliseRisco/cliente/${clienteId}`);
  }

  // Clientes em alerta
  async getClientesAlerta(limite: number = 10) {
    return this.get<ClientesAlertaResponse>(`/AnaliseRisco/clientes?limite=${limite}`);
  }

  // Resumo de risco
  async getResumoRisco() {
    return this.get<ResumoRisco>("/AnaliseRisco/resumo");
  }

  // Análise de pagamentos de um cliente
  async getAnalisePagamentos(clienteId: number) {
    return this.get<AnalisePagamentos>(`/AnaliseRisco/cliente/${clienteId}`);
  }

  // Health check
  async healthCheck() {
    return this.get<HealthCheck>("/Info/filiais");
  }
}

// Tipos do AI Service
export interface PrevisaoMesSeguinte {
  mes: string;
  valor_previsto: number;
  valor_minimo: number;
  valor_maximo: number;
  intervalo: string;
  confianca: "baixa" | "media" | "alta";
  confianca_percentual: number;
  tendencia: "subindo" | "estavel" | "caindo";
  observacoes: string[];
}

export interface TendenciaGeral {
  tendencia: "subindo" | "estavel" | "caindo";
  variacao_percentual: number;
  faturamento_atual: number;
  faturamento_anterior: number;
  periodo_atual: string;
  periodo_anterior: string;
}

export interface HistoricoMensal {
  mes: string;
  valor: number;
  quantidade_boletos: number;
}

export interface HistoricoMensalResponse {
  meses: HistoricoMensal[];
  total_periodo: number;
  media_mensal: number;
}

export interface PrevisaoMensal {
  mes: string;
  valor_previsto: number;
  valor_minimo: number;
  valor_maximo: number;
  confianca: string;
}

export interface PrevisaoFaturamentoResponse {
  previsoes: PrevisaoMensal[];
  tendencia_geral: string;
  crescimento_esperado: number;
  modelo_utilizado: string;
  data_geracao: string;
}

export interface FatorRisco {
  fator: string;
  peso: number;
  valor: string;
  impacto: "positivo" | "neutro" | "negativo";
}

export interface ClienteRisco {
  cliente_id: number;
  cliente_nome: string;
  score: number;
  nivel: "baixo" | "medio" | "alto" | "critico";
  fatores: FatorRisco[];
  recomendacao: string;
  ultima_atualizacao: string;
}

export interface ClienteAlerta {
  cliente_id: number;
  cliente_nome: string;
  documento: string;
  score: number;
  nivel: string;
  motivo_principal: string;
  valor_em_risco: number;
  boletos_atrasados: number;
  dias_maior_atraso: number;
}

export interface ClientesAlertaResponse {
  total_alertas: number;
  clientes: ClienteAlerta[];
  valor_total_em_risco: number;
  gerado_em: string;
}

export interface ResumoRisco {
  total_clientes_analisados: number;
  distribuicao: {
    baixo: number;
    medio: number;
    alto: number;
    critico: number;
  };
  valor_total_em_risco: number;
  clientes_em_alerta: number;
  tendencia_geral: string;
}

export interface AnalisePagamentos {
  cliente_id: number;
  cliente_nome: string;
  total_boletos: number;
  boletos_pagos: number;
  boletos_atrasados: number;
  taxa_pagamento: number;
  tempo_medio_pagamento_dias: number;
  valor_total_pago: number;
  valor_em_aberto: number;
  historico_ultimos_meses: {
    mes: string;
    pagos: number;
    atrasados: number;
  }[];
}

export interface HealthCheck {
  status: string;
  service: string;
  version: string;
  timestamp: string;
  checks: {
    api: string;
    database: string;
  };
}

export const aiServiceClient = new AIServiceClient(AI_SERVICE_URL, AI_SERVICE_API_KEY);
