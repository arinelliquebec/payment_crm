// Tipos para o módulo de boletos baseados no backend

export interface Boleto {
  id: number;
  contratoId: number;
  nsuCode: string;
  nsuDate: string;
  covenantCode: string;
  bankNumber: string;
  clientNumber?: string;
  dueDate: string;
  issueDate: string;
  nominalValue: number;
  documentKind: string;
  status: BoletoStatus;
  statusDescription?: string;

  // Campos de pagamento (novos)
  foiPago?: boolean;
  paidValue?: number;
  settlementDate?: string;
  paymentDate?: string;
  dataPagamento?: string; // Data de pagamento do banco (DateTime? formatado como string)

  // Dados do Pagador
  payerName: string;
  payerDocumentType: string;
  payerDocumentNumber: string;
  payerAddress: string;
  payerNeighborhood: string;
  payerCity: string;
  payerState: string;
  payerZipCode: string;

  // Dados de resposta da API Santander
  barCode?: string;
  digitableLine?: string;
  entryDate?: string;
  qrCodePix?: string;
  qrCodeUrl?: string;

  // Informações do Contrato
  contrato?: ContratoInfo;

  // Tipo do boleto manual (RENEGOCIACAO, ANTECIPACAO, AVULSO ou null para lote normal)
  tipoBoletoManual?: TipoBoletoManual | null;

  // Campos de controle
  dataCadastro: string;
  dataAtualizacao?: string;

  /** Indicador de vencimento conforme regra do backend (lista/detalhe). */
  estaVencido?: boolean;

  // Campos de erro
  errorCode?: string;
  errorMessage?: string;
  traceId?: string;
}

export interface ContratoInfo {
  id: number;
  numeroContrato: string;
  numeroPasta?: string;
  tipoServico?: string;
  clienteNome?: string;
  clienteDocumento?: string;
  valorContrato?: number;
  filialNome?: string;
  /** Quando a API anexa o contrato ao boleto (opcional). */
  situacao?: string;
}

// Tipos de protesto disponíveis
export type ProtestType =
  | "DIAS_CORRIDOS"
  | "DIAS_UTEIS"
  | "SEM_PROTESTO"
  | "NAO_PROTESTAR";

export interface CreateBoletoDTO {
  contratoId: number;
  dueDate: string;
  nominalValue: number;
  clientNumber?: string;

  // Campos opcionais para desconto, multa e juros
  finePercentage?: number;
  fineQuantityDays?: number;
  interestPercentage?: number;
  deductionValue?: number;
  writeOffQuantityDays?: number;

  // Campos de protesto (apenas para boletos manuais)
  protestType?: ProtestType;
  protestQuantityDays?: number;

  // Mensagens personalizadas
  messages?: string[];

  // Dados PIX (opcionais)
  pixKeyType?: PixKeyType;
  pixKey?: string;
  txId?: string;

  // Dados de desconto (opcionais)
  discount?: DescontoDTO;
}

export interface DescontoDTO {
  type: "VALOR_DATA_FIXA" | "PERCENTUAL_DATA_FIXA";
  discountOne?: DescontoValorDTO;
  discountTwo?: DescontoValorDTO;
  discountThree?: DescontoValorDTO;
}

export interface DescontoValorDTO {
  value: number;
  limitDate: string;
}

export type BoletoStatus =
  | "PENDENTE"
  | "REGISTRADO"
  | "ATIVO"
  | "LIQUIDADO"
  | "BAIXADO"
  | "VENCIDO"
  | "CANCELADO"
  | "ERRO";

export type PixKeyType =
  | "EMAIL"
  | "CPF"
  | "CNPJ"
  | "TELEFONE"
  | "CHAVE_ALEATORIA";

/** Resposta de GET /Boleto/dashboard (totais calculados no servidor). */
export interface DashboardFinanceiro {
  /** Aliases curtos retornados pela API (opcionais). */
  total?: number;
  valorTotal?: number;
  totalPago?: number;
  pendentes?: number;
  pagos?: number;
  vencidos?: number;

  totalBoletos: number;
  boletosPendentes: number;
  boletosRegistrados: number;
  boletosLiquidados: number;
  boletosVencidos: number;
  boletosCancelados: number;
  valorTotalRegistrado: number;
  valorTotalLiquidado: number;
  boletosHoje?: number;
  boletosEsteMes?: number;
}

export interface BoletoFilters {
  status?: BoletoStatus;
  contratoId?: number;
  clienteNome?: string;
  dataInicio?: string;       // Filtro por data de vencimento (início)
  dataFim?: string;          // Filtro por data de vencimento (fim)
  dataEmissaoInicio?: string; // Filtro por data de emissão (início)
  dataEmissaoFim?: string;    // Filtro por data de emissão (fim)
  valorMinimo?: number;
  valorMaximo?: number;
}

/** Totais da listagem calculados no backend (GET /Boleto, etc.). */
export interface BoletosListagemResumo {
  total: number;
  valorTotal: number;
  totalPago: number;
  pendentes: number;
  pagos: number;
  vencidos: number;
}

function pickNumericField(
  obj: Record<string, unknown>,
  keys: string[],
): number | null {
  for (const k of keys) {
    const v = obj[k];
    if (v === undefined || v === null || v === "") continue;
    const n = typeof v === "string" ? Number(v.replace(",", ".")) : Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return null;
}

/** Converte o JSON do dashboard / resumo da API em {@link BoletosListagemResumo}. */
export function parseResumoPayload(raw: unknown): BoletosListagemResumo | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const total = pickNumericField(r, [
    "total",
    "Total",
    "totalBoletos",
    "TotalBoletos",
  ]);
  const valorTotal = pickNumericField(r, [
    "valorTotal",
    "ValorTotal",
    "valorTotalNominal",
    "ValorTotalNominal",
    "valorTotalRegistrado",
    "ValorTotalRegistrado",
  ]);
  const totalPago = pickNumericField(r, [
    "totalPago",
    "TotalPago",
    "valorTotalPago",
    "ValorTotalPago",
    "valorPago",
    "ValorPago",
    "valorTotalLiquidado",
    "ValorTotalLiquidado",
  ]);
  const pendentes = pickNumericField(r, [
    "pendentes",
    "Pendentes",
    "quantidadePendentes",
    "QuantidadePendentes",
    "boletosPendentes",
    "BoletosPendentes",
  ]);
  const pagos = pickNumericField(r, [
    "pagos",
    "Pagos",
    "quantidadePagos",
    "QuantidadePagos",
    "boletosPagos",
    "BoletosPagos",
    "boletosLiquidados",
    "BoletosLiquidados",
  ]);
  const vencidos = pickNumericField(r, [
    "vencidos",
    "Vencidos",
    "quantidadeVencidos",
    "QuantidadeVencidos",
    "boletosVencidos",
    "BoletosVencidos",
  ]);
  if (
    total === null &&
    valorTotal === null &&
    totalPago === null &&
    pendentes === null &&
    pagos === null &&
    vencidos === null
  ) {
    return null;
  }
  return {
    total: Math.round(total ?? 0),
    valorTotal: valorTotal ?? 0,
    totalPago: totalPago ?? 0,
    pendentes: Math.round(pendentes ?? 0),
    pagos: Math.round(pagos ?? 0),
    vencidos: Math.round(vencidos ?? 0),
  };
}

function unwrapListagemEnvelope(raw: unknown): unknown {
  let cur: unknown = raw;
  for (let depth = 0; depth < 4; depth++) {
    if (!cur || typeof cur !== "object" || Array.isArray(cur)) break;
    const o = cur as Record<string, unknown>;
    const inner = o.data ?? o.Data ?? o.result ?? o.Result;
    if (inner !== undefined && inner !== cur) {
      cur = inner;
      continue;
    }
    break;
  }
  return cur;
}

/**
 * Interpreta resposta da listagem de boletos: array legado ou envelope com lista + resumo.
 */
export function parseBoletosListResponse(raw: unknown): {
  boletos: Boleto[];
  resumo: BoletosListagemResumo | null;
} {
  const payload = unwrapListagemEnvelope(raw);
  if (Array.isArray(payload)) {
    return { boletos: payload as Boleto[], resumo: null };
  }
  if (!payload || typeof payload !== "object") {
    return { boletos: [], resumo: null };
  }
  const o = payload as Record<string, unknown>;
  const list =
    (Array.isArray(o.boletos) ? o.boletos : null) ??
    (Array.isArray(o.Boletos) ? o.Boletos : null) ??
    (Array.isArray(o.items) ? o.items : null) ??
    (Array.isArray(o.Items) ? o.Items : null) ??
    (Array.isArray(o.data) ? o.data : null) ??
    (Array.isArray(o.Data) ? o.Data : null);
  if (!list) {
    return { boletos: [], resumo: null };
  }
  const resumoRaw =
    o.resumo ?? o.Resumo ?? o.totais ?? o.Totais ?? o.summary ?? o.Summary;
  return {
    boletos: list as Boleto[],
    resumo: parseResumoPayload(resumoRaw),
  };
}

// Opções para status com cores e labels
export const BoletoStatusOptions = [
  {
    value: "PENDENTE" as BoletoStatus,
    label: "Pendente",
    color: "bg-gray-100 text-gray-800 border-gray-200",
  },
  {
    value: "REGISTRADO" as BoletoStatus,
    label: "Registrado",
    color: "bg-blue-100 text-blue-800 border-blue-200",
  },
  {
    value: "ATIVO" as BoletoStatus,
    label: "Ativo",
    color: "bg-blue-100 text-blue-800 border-blue-200",
  },
  {
    value: "LIQUIDADO" as BoletoStatus,
    label: "Pago (Boleto)",
    color: "bg-green-100 text-green-800 border-green-200",
  },
  {
    value: "BAIXADO" as BoletoStatus,
    label: "Baixado", // Pode ser pago via PIX ou expirado - depende de foiPago
    color: "bg-gray-100 text-gray-800 border-gray-200",
  },
  {
    value: "VENCIDO" as BoletoStatus,
    label: "Vencido",
    color: "bg-red-100 text-red-800 border-red-200",
  },
  {
    value: "CANCELADO" as BoletoStatus,
    label: "Cancelado",
    color: "bg-gray-300 text-gray-800 border-gray-400",
  },
  {
    value: "ERRO" as BoletoStatus,
    label: "Erro",
    color: "bg-pink-100 text-pink-800 border-pink-200",
  },
] as const;

/** Normaliza status vindo da API para comparação (evita "Liquidado" vs "LIQUIDADO"). */
export function normalizarStatusBoleto(
  status: Boleto["status"] | string | null | undefined
): string {
  return String(status ?? "")
    .toUpperCase()
    .trim();
}

/**
 * Normaliza `foiPago` da API. No banco/backend o campo é boolean (true/false);
 * `undefined` quando vier null/ausente → `verificarSeFoiPago` usa fallback por status (ex.: LIQUIDADO).
 */
export function parseFoiPagoApiValue(value: unknown): boolean | undefined {
  if (value === true) return true;
  if (value === false) return false;
  return undefined;
}

/**
 * Comissões: só contabiliza boleto com `foiPago === true`.
 * `false`, `null`, `undefined` ou ausente no JSON não entram (sem inferir por LIQUIDADO/BAIXADO).
 */
export function boletoPagoParaComissao(boleto: Pick<Boleto, "foiPago">): boolean {
  return boleto.foiPago === true;
}

/** Valor pago numérico a partir da API (aceita string "1500.00"). */
export function parsePaidValueApi(paid: unknown): number | undefined {
  if (paid === null || paid === undefined || paid === "") return undefined;
  const val =
    typeof paid === "string"
      ? Number(paid.replace(/\s/g, "").replace(",", "."))
      : Number(paid);
  if (Number.isNaN(val) || val <= 0) return undefined;
  return val;
}

// Função auxiliar para verificar se o boleto foi pago
// BAIXADO: só entra em totais/comissão com foiPago === true (ex.: PIX pago). Baixado com foiPago false ou ausente = não pago.
// LIQUIDADO: pago via código de barras costuma vir sem foiPago (fallback abaixo).
export function verificarSeFoiPago(boleto: Boleto): boolean {
  const st = normalizarStatusBoleto(boleto.status);

  if (st === "CANCELADO" || st === "ERRO") {
    return false;
  }

  if (st === "BAIXADO") {
    return boleto.foiPago === true;
  }

  if (boleto.foiPago === true) {
    return true;
  }

  if (boleto.foiPago === false) {
    return false;
  }

  if (st === "LIQUIDADO") {
    return true;
  }

  return false;
}

/**
 * Valor efetivo recebido no pagamento (comissões e totais devem usar isto quando existir).
 * Se a API não enviar paidValue ou for 0, usa nominalValue.
 */
export function valorEfetivoPagoBoleto(
  boleto: Pick<Boleto, "paidValue" | "nominalValue">
): number {
  const nominal = Number(boleto.nominalValue) || 0;
  const paid = parsePaidValueApi(
    (boleto as { paidValue?: unknown }).paidValue
  );
  if (paid !== undefined) return paid;
  return nominal;
}

// Função para obter a configuração de exibição do status
// IMPORTANTE: Usar foiPago como fonte da verdade
export function getStatusDisplayConfig(boleto: Boleto): {
  text: string;
  color: string;
  bgColor: string;
  isPago: boolean;
} {
  // 1. Primeiro verificar se foi pago usando o campo foiPago
  if (boleto.foiPago === true) {
    if (boleto.status === "LIQUIDADO") {
      return {
        text: "Pago (Cód. Barras)",
        color: "text-green-400",
        bgColor: "bg-green-500/20 border-green-500/30",
        isPago: true,
      };
    }
    if (boleto.status === "BAIXADO") {
      return {
        text: "Pago (PIX)",
        color: "text-green-400",
        bgColor: "bg-green-500/20 border-green-500/30",
        isPago: true,
      };
    }
    // Qualquer outro status com foiPago = true
    return {
      text: "Pago",
      color: "text-green-400",
      bgColor: "bg-green-500/20 border-green-500/30",
      isPago: true,
    };
  }

  // 2. Se não foi pago (foiPago === false ou undefined), verificar o status
  switch (boleto.status) {
    case "BAIXADO":
      // BAIXADO sem foiPago = Expirou após 30 dias sem pagamento
      return {
        text: "Baixado (Não Pago)",
        color: "text-orange-400",
        bgColor: "bg-orange-500/20 border-orange-500/30",
        isPago: false,
      };
    case "LIQUIDADO":
      // LIQUIDADO sem foiPago = Caso raro, mas mostrar como pago
      return {
        text: "Pago (Cód. Barras)",
        color: "text-green-400",
        bgColor: "bg-green-500/20 border-green-500/30",
        isPago: true,
      };
    case "ATIVO":
    case "REGISTRADO":
      return {
        text: "Aguardando",
        color: "text-blue-400",
        bgColor: "bg-blue-500/20 border-blue-500/30",
        isPago: false,
      };
    case "VENCIDO":
      return {
        text: "Vencido",
        color: "text-amber-400",
        bgColor: "bg-amber-500/20 border-amber-500/30",
        isPago: false,
      };
    case "CANCELADO":
      return {
        text: "Cancelado",
        color: "text-red-400",
        bgColor: "bg-red-500/20 border-red-500/30",
        isPago: false,
      };
    case "PENDENTE":
      return {
        text: "Pendente",
        color: "text-neutral-400",
        bgColor: "bg-neutral-700 border-neutral-600",
        isPago: false,
      };
    case "ERRO":
      return {
        text: "Erro",
        color: "text-pink-400",
        bgColor: "bg-pink-500/20 border-pink-500/30",
        isPago: false,
      };
    default:
      return {
        text: boleto.status || "Desconhecido",
        color: "text-neutral-400",
        bgColor: "bg-neutral-700 border-neutral-600",
        isPago: false,
      };
  }
}

export const PixKeyTypeOptions = [
  { value: "EMAIL" as PixKeyType, label: "E-mail" },
  { value: "CPF" as PixKeyType, label: "CPF" },
  { value: "CNPJ" as PixKeyType, label: "CNPJ" },
  { value: "TELEFONE" as PixKeyType, label: "Telefone" },
  { value: "CHAVE_ALEATORIA" as PixKeyType, label: "Chave Aleatória" },
] as const;

// ===== Tipos para Envio de Email =====

// Resposta do envio de email individual
export interface EmailEnvioInfo {
  enviado: boolean | null;
  destino: string | null;
  erro: string | null;
}

// Resposta da criação de boleto (POST /api/Boleto) com info de email
export interface CreateBoletoResponse {
  boleto: Boleto;
  email: EmailEnvioInfo | null;
}

// Resposta do endpoint de envio/reenvio de email
export interface EnviarEmailResponse {
  sucesso: boolean;
  erro: string | null;
  emailDestino: string | null;
}

// Request para enviar email com destino alternativo
export interface EnviarEmailRequest {
  emailDestino?: string;
}

// ===== Tipos para Boleto Manual (Renegociação/Antecipação/Avulso) =====

export type TipoBoletoManual = "AVULSO" | "RENEGOCIACAO" | "ANTECIPACAO";

export interface ParcelaDisponivelDTO {
  boletoId?: number;
  numeroParcela: number;
  valorOriginal: number;
  vencimentoOriginal: string;
  status: string;
  descricao: string;
}

export interface ParcelasDisponiveisResponse {
  parcelasRenegociacao: ParcelaDisponivelDTO[];
  parcelasAntecipacao: ParcelaDisponivelDTO[];
  valorParcela: number;
  totalParcelas: number;
  parcelaAtual: number;
  parcelasEmAtraso: number;
}

export interface ParcelaSelecionadaDTO {
  boletoId?: number;
  numeroParcela: number;
  valorOriginal: number;
  vencimentoOriginal?: string;
}

export interface CreateBoletoManualDTO extends CreateBoletoDTO {
  tipoBoletoManual?: TipoBoletoManual;
  parcelasSelecionadas?: ParcelaSelecionadaDTO[];
}
