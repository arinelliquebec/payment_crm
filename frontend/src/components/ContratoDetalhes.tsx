// src/components/ContratoDetalhes.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FileText,
  Users,
  Calendar,
  DollarSign,
  Clock,
  Edit,
  RefreshCcw,
  Phone,
  Mail,
  Building2,
  MapPin,
  History,
  MessageSquare,
  TrendingUp,
  Loader2,
  FolderOpen,
  Briefcase,
  Target,
  Percent,
  CreditCard,
  Paperclip,
  AlertTriangle,
  Scale,
} from "lucide-react";
import {
  Contrato,
  Cliente,
  HistoricoSituacaoContrato,
  SituacaoContratoOptions,
  SituacaoContrato,
} from "@/types/api";
import { useContratos } from "@/hooks/useContratos";
import { cn } from "@/lib/utils";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ContratoDetalhesProps {
  contrato: Contrato;
  onClose: () => void;
  onEdit: () => void;
  onMudarSituacao: () => void;
}

function SituacaoBadge({ situacao }: { situacao: SituacaoContrato }) {
  const config = SituacaoContratoOptions.find((opt) => opt.value === situacao);

  if (!config) {
    return <span className="text-xs text-gray-500">Desconhecido</span>;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium",
        config.color
      )}
    >
      {config.label}
    </span>
  );
}

export default function ContratoDetalhes({
  contrato,
  onClose,
  onEdit,
  onMudarSituacao,
}: ContratoDetalhesProps) {
  const [activeTab, setActiveTab] = useState<"info" | "historico">("info");
  const [historico, setHistorico] = useState<HistoricoSituacaoContrato[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const [clienteCompleto, setClienteCompleto] = useState<Cliente | null>(null);
  const [loadingCliente, setLoadingCliente] = useState(false);
  const { getHistoricoSituacao, fetchClienteCompleto } = useContratos();

  const normalizeSituacao = useCallback(
    (s: string | null | undefined): SituacaoContrato => {
      if (!s) return "Leed";
      const m = s.trim().toUpperCase();
      const map: Record<string, SituacaoContrato> = {
        LEED: "Leed",
        LEAD: "Leed",
        PROSPECTO: "Prospecto",
        "CONTRATO ENVIADO": "Contrato Enviado",
        "CONTRATO ASSINADO": "Contrato Assinado",
        RETORNAR: "Retornar",
        "SEM INTERESSE": "Sem Interesse",
        RESCINDIDO: "RESCINDIDO",
        "RESCINDIDO COM DEBITO": "RESCINDIDO COM DEBITO",
        SUSPENSO: "SUSPENSO",
        "SUSP. C/ DEBITO": "SUSP. C/ DEBITO",
        CLIENTE: "CLIENTE",
      };
      return map[m] ?? "Leed";
    },
    []
  );

  const loadClienteCompleto = useCallback(async () => {
    if (!contrato.clienteId) return;

    console.info(
      "🔧 ContratoDetalhes: Carregando dados completos do cliente",
      contrato.clienteId
    );
    setLoadingCliente(true);
    try {
      const clienteData = await fetchClienteCompleto(contrato.clienteId);
      setClienteCompleto(clienteData);
      console.info(
        "🔧 ContratoDetalhes: Dados do cliente carregados:",
        clienteData
      );
    } catch (error) {
      console.info(
        "🔧 ContratoDetalhes: Endpoint /Cliente/{id} não disponível, usando dados básicos:",
        error
      );
      // Manter os dados do cliente que vieram com o contrato
      setClienteCompleto(null);
    } finally {
      setLoadingCliente(false);
    }
  }, [contrato.clienteId, fetchClienteCompleto]);

  const loadHistorico = useCallback(async () => {
    console.info(
      "🔧 ContratoDetalhes: Carregando histórico para contrato",
      contrato.id
    );
    setLoadingHistorico(true);
    try {
      const data = await getHistoricoSituacao(contrato.id);
      console.info("🔧 ContratoDetalhes: Dados recebidos do hook:", data);
      setHistorico(data || []);
    } catch (error) {
      console.error("🔧 ContratoDetalhes: Erro ao carregar histórico:", error);
      // Em caso de erro, definir histórico vazio
      setHistorico([]);
    } finally {
      setLoadingHistorico(false);
    }
  }, [contrato.id, getHistoricoSituacao]);

  useEffect(() => {
    // Carregar dados completos do cliente quando o componente for montado
    loadClienteCompleto();
  }, [loadClienteCompleto]);

  useEffect(() => {
    if (activeTab === "historico") {
      loadHistorico();
    }
  }, [activeTab, loadHistorico]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "Não informado";
    try {
      return format(parseISO(date), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return date;
    }
  };

  const formatDateTime = (date: string | null | undefined) => {
    if (!date) return "Não informado";
    try {
      return format(parseISO(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return date;
    }
  };

  const formatRelativeTime = (date: string | null | undefined) => {
    if (!date) return "";
    try {
      return formatDistanceToNow(parseISO(date), {
        addSuffix: true,
        locale: ptBR,
      });
    } catch {
      return "";
    }
  };

  // Usar dados completos do cliente se disponíveis, caso contrário usar os dados que vieram com o contrato
  const cliente = clienteCompleto || contrato.cliente;
  const consultor = contrato.consultor;
  const isProximoContatoVencido = contrato.dataProximoContato
    ? new Date(contrato.dataProximoContato) < new Date()
    : false;

  return (
    <AnimatePresence>
      {/* Overlay */}
      <motion.div
        key="contrato-detalhes-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9999]"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        key="contrato-detalhes-modal"
        initial={{ opacity: 0, scale: 0.95, x: 100 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.95, x: 100 }}
        className="fixed right-0 top-0 h-full w-full max-w-4xl bg-white shadow-2xl z-[9999] flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Detalhes do Contrato #{contrato.id}
                </h2>
                <p className="text-sm text-white/80">
                  Criado em {formatDate(contrato.dataCadastro)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-neutral-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab("info")}
              className={cn(
                "flex-1 px-4 py-3 text-sm font-medium transition-all",
                activeTab === "info"
                  ? "text-primary-600 border-b-2 border-primary-600 bg-primary-50/50"
                  : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
              )}
            >
              Informações Gerais
            </button>
            <button
              onClick={() => setActiveTab("historico")}
              className={cn(
                "flex-1 px-4 py-3 text-sm font-medium transition-all",
                activeTab === "historico"
                  ? "text-primary-600 border-b-2 border-primary-600 bg-primary-50/50"
                  : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
              )}
            >
              Histórico de Situações
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "info" ? (
            <div className="p-6 space-y-6 h-full overflow-y-auto">
              {/* Status e Ações */}
              <div className="bg-gradient-to-r from-neutral-50 to-neutral-100 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-600 mb-2">
                      Situação Atual
                    </p>
                    <SituacaoBadge situacao={contrato.situacao} />
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onMudarSituacao}
                      className="flex items-center gap-2 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <RefreshCcw className="w-4 h-4" />
                      Mudar Situação
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onEdit}
                      className="flex items-center gap-2 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Editar
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Informações do Cliente */}
              <div className="bg-white rounded-xl border border-neutral-200 p-5">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary-600" />
                  Informações do Cliente
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-neutral-600">Nome</p>
                      <p className="font-medium text-neutral-900">
                        {cliente?.pessoaFisica?.nome ||
                          cliente?.pessoaJuridica?.razaoSocial ||
                          "Cliente não identificado"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-600">E-mail</p>
                      <p className="font-medium text-neutral-900 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-neutral-400" />
                        {cliente?.pessoaFisica?.email ||
                          cliente?.pessoaJuridica?.email ||
                          "Não informado"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-600">Filial</p>
                      <p className="font-medium text-neutral-900 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-neutral-400" />
                        {cliente?.filial?.nome || "Não informada"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-neutral-600">Documento</p>
                      <p className="font-medium text-neutral-900">
                        {cliente?.pessoaFisica?.cpf ||
                          cliente?.pessoaJuridica?.cnpj ||
                          "Não informado"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-600">Telefones</p>
                      <div className="space-y-1">
                        {cliente?.pessoaFisica?.telefone1 && (
                          <p className="font-medium text-neutral-900 flex items-center gap-2">
                            <Phone className="w-4 h-4 text-neutral-400" />
                            {cliente.pessoaFisica.telefone1}
                          </p>
                        )}
                        {cliente?.pessoaFisica?.telefone2 && (
                          <p className="font-medium text-neutral-900 flex items-center gap-2">
                            <Phone className="w-4 h-4 text-neutral-400" />
                            {cliente.pessoaFisica.telefone2}
                          </p>
                        )}
                        {cliente?.pessoaJuridica?.telefone1 && (
                          <p className="font-medium text-neutral-900 flex items-center gap-2">
                            <Phone className="w-4 h-4 text-neutral-400" />
                            {cliente.pessoaJuridica.telefone1}
                          </p>
                        )}
                        {cliente?.pessoaJuridica?.telefone2 && (
                          <p className="font-medium text-neutral-900 flex items-center gap-2">
                            <Phone className="w-4 h-4 text-neutral-400" />
                            {cliente.pessoaJuridica.telefone2}
                          </p>
                        )}
                        {cliente?.pessoaJuridica?.telefone3 && (
                          <p className="font-medium text-neutral-900 flex items-center gap-2">
                            <Phone className="w-4 h-4 text-neutral-400" />
                            {cliente.pessoaJuridica.telefone3}
                          </p>
                        )}
                        {cliente?.pessoaJuridica?.telefone4 && (
                          <p className="font-medium text-neutral-900 flex items-center gap-2">
                            <Phone className="w-4 h-4 text-neutral-400" />
                            {cliente.pessoaJuridica.telefone4}
                          </p>
                        )}
                        {!cliente?.pessoaFisica?.telefone1 &&
                          !cliente?.pessoaFisica?.telefone2 &&
                          !cliente?.pessoaJuridica?.telefone1 &&
                          !cliente?.pessoaJuridica?.telefone2 &&
                          !cliente?.pessoaJuridica?.telefone3 &&
                          !cliente?.pessoaJuridica?.telefone4 && (
                            <p className="text-neutral-500">Não informado</p>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Consultor Responsável */}
              <div className="bg-white rounded-xl border border-neutral-200 p-5">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary-600" />
                  Consultor Responsável
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-neutral-600">Nome</p>
                      <p className="font-medium text-neutral-900">
                        {consultor?.pessoaFisica?.nome || "Não atribuído"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-600">E-mail</p>
                      <p className="font-medium text-neutral-900 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-neutral-400" />
                        {consultor?.pessoaFisica?.email || "Não informado"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-neutral-600">Telefones</p>
                      <div className="space-y-1">
                        {consultor?.pessoaFisica?.telefone1 && (
                          <p className="font-medium text-neutral-900 flex items-center gap-2">
                            <Phone className="w-4 h-4 text-neutral-400" />
                            {consultor.pessoaFisica.telefone1}
                          </p>
                        )}
                        {consultor?.pessoaFisica?.telefone2 && (
                          <p className="font-medium text-neutral-900 flex items-center gap-2">
                            <Phone className="w-4 h-4 text-neutral-400" />
                            {consultor.pessoaFisica.telefone2}
                          </p>
                        )}
                        {!consultor?.pessoaFisica?.telefone1 &&
                          !consultor?.pessoaFisica?.telefone2 && (
                            <p className="text-neutral-500">Não informado</p>
                          )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-600">Filial</p>
                      <p className="font-medium text-neutral-900 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-neutral-400" />
                        {consultor?.filial?.nome || "Não informada"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Parceiro (se houver) */}
              {contrato.parceiro && (
                <div className="bg-white rounded-xl border border-neutral-200 p-5">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                    <Scale className="w-5 h-5 text-primary-600" />
                    Parceiro
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-neutral-600">Nome</p>
                        <p className="font-medium text-neutral-900">
                          {contrato.parceiro.pessoaFisica?.nome ||
                            "Não informado"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-neutral-600">E-mail</p>
                        <p className="font-medium text-neutral-900 flex items-center gap-2">
                          <Mail className="w-4 h-4 text-neutral-400" />
                          {contrato.parceiro.email ||
                            contrato.parceiro.pessoaFisica?.email ||
                            "Não informado"}
                        </p>
                      </div>
                      {contrato.parceiro.oab && (
                        <div>
                          <p className="text-sm text-neutral-600">OAB</p>
                          <p className="font-medium text-neutral-900">
                            {contrato.parceiro.oab}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-neutral-600">Telefone</p>
                        <div className="space-y-1">
                          {contrato.parceiro.telefone ||
                          contrato.parceiro.pessoaFisica?.telefone1 ? (
                            <p className="font-medium text-neutral-900 flex items-center gap-2">
                              <Phone className="w-4 h-4 text-neutral-400" />
                              {contrato.parceiro.telefone ||
                                contrato.parceiro.pessoaFisica?.telefone1}
                            </p>
                          ) : (
                            <p className="text-neutral-500">Não informado</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-neutral-600">Filial</p>
                        <p className="font-medium text-neutral-900 flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-neutral-400" />
                          {contrato.parceiro.filial?.nome || "Não informada"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Informações de Contato */}
              <div className="bg-white rounded-xl border border-neutral-200 p-5">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary-600" />
                  Informações de Contato
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-neutral-600">Último Contato</p>
                    <p className="font-medium text-neutral-900">
                      {formatDate(contrato.dataUltimoContato)}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      {formatRelativeTime(contrato.dataUltimoContato)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600">Próximo Contato</p>
                    <p
                      className={cn(
                        "font-medium",
                        isProximoContatoVencido
                          ? "text-red-600"
                          : "text-neutral-900"
                      )}
                    >
                      {formatDate(contrato.dataProximoContato)}
                    </p>
                    <p
                      className={cn(
                        "text-xs mt-1",
                        isProximoContatoVencido
                          ? "text-red-500"
                          : "text-neutral-500"
                      )}
                    >
                      {isProximoContatoVencido ? "⚠️ Vencido " : ""}
                      {formatRelativeTime(contrato.dataProximoContato)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Dados Básicos do Contrato */}
              {(contrato.numeroPasta ||
                contrato.tipoServico ||
                contrato.dataFechamentoContrato) && (
                <div className="bg-white rounded-xl border border-neutral-200 p-5">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary-600" />
                    Dados do Contrato
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {contrato.numeroPasta && (
                      <div>
                        <p className="text-sm text-neutral-600">
                          Número da Pasta
                        </p>
                        <p className="font-medium text-neutral-900 flex items-center gap-2">
                          <FolderOpen className="w-4 h-4 text-neutral-400" />
                          {contrato.numeroPasta}
                        </p>
                      </div>
                    )}
                    {contrato.tipoServico && (
                      <div>
                        <p className="text-sm text-neutral-600">
                          Tipo de Serviço
                        </p>
                        <p className="font-medium text-neutral-900 flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-neutral-400" />
                          {contrato.tipoServico}
                        </p>
                      </div>
                    )}
                    {contrato.dataFechamentoContrato && (
                      <div>
                        <p className="text-sm text-neutral-600">
                          Data de Fechamento
                        </p>
                        <p className="font-medium text-neutral-900 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-neutral-400" />
                          {formatDate(contrato.dataFechamentoContrato)}
                        </p>
                      </div>
                    )}
                  </div>
                  {contrato.objetoContrato && (
                    <div className="mt-4 pt-4 border-t border-neutral-200">
                      <p className="text-sm text-neutral-600">
                        Objeto do Contrato
                      </p>
                      <p className="font-medium text-neutral-900 flex items-start gap-2 mt-1">
                        <Target className="w-4 h-4 text-neutral-400 mt-0.5" />
                        <span>{contrato.objetoContrato}</span>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Valores do Contrato */}
              <div className="bg-white rounded-xl border border-neutral-200 p-5">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary-600" />
                  Valores do Contrato
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-neutral-600">Valor Devido</p>
                      <p className="text-lg font-bold text-neutral-900">
                        {formatCurrency(contrato.valorDevido)}
                      </p>
                    </div>
                    {contrato.valorNegociado && (
                      <div>
                        <p className="text-sm text-neutral-600">
                          Valor Negociado
                        </p>
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(contrato.valorNegociado)}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    {contrato.comissao && (
                      <div>
                        <p className="text-sm text-neutral-600">Comissão</p>
                        <p className="text-lg font-bold text-neutral-900">
                          {contrato.comissao}%
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Dados de Pagamento */}
              {(contrato.valorEntrada ||
                contrato.valorParcela ||
                contrato.numeroParcelas ||
                contrato.primeiroVencimento) && (
                <div className="bg-white rounded-xl border border-neutral-200 p-5">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary-600" />
                    Dados de Pagamento
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {contrato.valorEntrada && (
                      <div>
                        <p className="text-sm text-neutral-600">
                          Valor de Entrada
                        </p>
                        <p className="text-xl font-bold text-green-600">
                          {formatCurrency(contrato.valorEntrada)}
                        </p>
                      </div>
                    )}
                    {contrato.valorParcela && (
                      <div>
                        <p className="text-sm text-neutral-600">
                          Valor da Parcela
                        </p>
                        <p className="text-xl font-bold text-blue-600">
                          {formatCurrency(contrato.valorParcela)}
                        </p>
                      </div>
                    )}
                    {contrato.numeroParcelas && (
                      <div>
                        <p className="text-sm text-neutral-600">
                          Número de Parcelas
                        </p>
                        <p className="font-medium text-neutral-900 flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-neutral-400" />
                          {contrato.numeroParcelas}x
                        </p>
                      </div>
                    )}
                    {contrato.primeiroVencimento && (
                      <div>
                        <p className="text-sm text-neutral-600">
                          Primeiro Vencimento
                        </p>
                        <p className="font-medium text-neutral-900 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-neutral-400" />
                          {formatDate(contrato.primeiroVencimento)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Anexos e Pendências */}
              {(contrato.anexoDocumento || contrato.pendencias) && (
                <div className="bg-white rounded-xl border border-neutral-200 p-5">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                    <Paperclip className="w-5 h-5 text-primary-600" />
                    Documentos e Pendências
                  </h3>
                  {contrato.anexoDocumento && (
                    <div className="mb-4">
                      <p className="text-sm text-neutral-600">
                        Anexo de Documento
                      </p>
                      <p className="font-medium text-neutral-900 flex items-center gap-2 mt-1">
                        <Paperclip className="w-4 h-4 text-neutral-400" />
                        {contrato.anexoDocumento}
                      </p>
                    </div>
                  )}
                  {contrato.pendencias && (
                    <div>
                      <p className="text-sm text-neutral-600">Pendências</p>
                      <p className="font-medium text-neutral-900 flex items-start gap-2 mt-1">
                        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                        <span className="whitespace-pre-wrap">
                          {contrato.pendencias}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Observações */}
              {contrato.observacoes && (
                <div className="bg-white rounded-xl border border-neutral-200 p-5">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary-600" />
                    Observações
                  </h3>
                  <p className="text-neutral-700 whitespace-pre-wrap">
                    {contrato.observacoes}
                  </p>
                </div>
              )}

              {/* Metadados */}
              <div className="bg-neutral-50 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-neutral-600">Data de Criação</p>
                    <p className="font-medium text-neutral-900">
                      {formatDateTime(contrato.dataCadastro)}
                    </p>
                  </div>
                  {contrato.dataAtualizacao && (
                    <div>
                      <p className="text-neutral-600">Última Atualização</p>
                      <p className="font-medium text-neutral-900">
                        {formatDateTime(contrato.dataAtualizacao)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Tab Histórico */
            <div className="p-6 space-y-4 h-full overflow-y-auto">
              {loadingHistorico ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                </div>
              ) : historico.length > 0 ? (
                <div className="space-y-4">
                  {historico.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-xl border border-neutral-200 p-4"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-primary-100 rounded-lg">
                          <History className="w-5 h-5 text-primary-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <SituacaoBadge
                              situacao={normalizeSituacao(
                                item.situacaoAnterior as unknown as string
                              )}
                            />
                            <TrendingUp className="w-4 h-4 text-neutral-400" />
                            <SituacaoBadge
                              situacao={normalizeSituacao(
                                item.novaSituacao as unknown as string
                              )}
                            />
                          </div>
                          <p className="text-sm text-neutral-700 mb-2">
                            {item.motivoMudanca}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {formatDateTime(item.dataMudanca)} •{" "}
                            {formatRelativeTime(item.dataMudanca)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <History className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                  <p className="text-neutral-600">
                    Nenhuma mudança de situação registrada
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
