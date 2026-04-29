"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  Users,
  Calendar,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Mail,
  MailX,
  MailWarning,
} from "lucide-react";
import {
  PreviewGeracaoLote,
  ResultadoGeracaoLote,
  ContratoPreview,
} from "@/types/boleto-lote";

interface GerarBoletosLoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type ModalStep = "preview" | "gerando" | "resultado";

export function GerarBoletosLoteModal({
  isOpen,
  onClose,
  onSuccess,
}: GerarBoletosLoteModalProps) {
  const [step, setStep] = useState<ModalStep>("preview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<PreviewGeracaoLote | null>(null);
  const [resultado, setResultado] = useState<ResultadoGeracaoLote | null>(null);
  const [expandedContratos, setExpandedContratos] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPreview();
    } else {
      // Reset state when modal closes
      setStep("preview");
      setPreview(null);
      setResultado(null);
      setError("");
      setExpandedContratos(false);
    }
  }, [isOpen]);

  const fetchPreview = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const usuarioId = localStorage.getItem("usuarioId");

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api"
        }/Boleto/gerar-lote/preview`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Usuario-Id": usuarioId || "1",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao carregar preview");
      }

      const data = await response.json();
      setPreview(data);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar preview");
    } finally {
      setLoading(false);
    }
  };

  const executarGeracao = async () => {
    setStep("gerando");
    setError("");

    try {
      const token = localStorage.getItem("token");
      const usuarioId = localStorage.getItem("usuarioId");

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api"
        }/Boleto/gerar-lote`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "X-Usuario-Id": usuarioId || "1",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao gerar boletos");
      }

      const data = await response.json();
      setResultado(data);
      setStep("resultado");

      if (data.totalSucesso > 0) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || "Erro ao gerar boletos");
      setStep("preview");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR");
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { bg: string; text: string; icon: any }
    > = {
      SUCESSO: {
        bg: "bg-green-500/20",
        text: "text-green-400",
        icon: CheckCircle,
      },
      PARCIAL: {
        bg: "bg-amber-500/20",
        text: "text-amber-400",
        icon: AlertTriangle,
      },
      ERRO: { bg: "bg-red-500/20", text: "text-red-400", icon: XCircle },
      NENHUM: {
        bg: "bg-neutral-500/20",
        text: "text-neutral-400",
        icon: Clock,
      },
    };

    const config = statusConfig[status] || statusConfig.NENHUM;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${config.bg} ${config.text} font-medium`}
      >
        <Icon className="w-4 h-4" />
        {status}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-neutral-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-neutral-800 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-amber-500 to-amber-600 p-6 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-black/20 rounded-xl">
                <FileText className="w-6 h-6 text-neutral-950" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-neutral-950">
                  Gerar Boletos em Lote
                </h2>
                <p className="text-sm text-neutral-800">
                  {step === "preview" && "Prévia dos boletos a serem gerados"}
                  {step === "gerando" && "Processando geração..."}
                  {step === "resultado" && "Resultado da geração"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-black/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-neutral-950" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Loading State */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <RefreshCw className="w-12 h-12 text-amber-400 animate-spin mb-4" />
                <p className="text-neutral-300 text-lg">
                  Carregando preview...
                </p>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl mb-6">
                <div className="flex items-center gap-2 text-red-400">
                  <XCircle className="w-5 h-5" />
                  <p>{error}</p>
                </div>
              </div>
            )}

            {/* Preview Step */}
            {step === "preview" && preview && !loading && (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-neutral-400 mb-2">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">Contratos Ativos</span>
                    </div>
                    <p className="text-2xl font-bold text-neutral-100">
                      {preview.totalContratosAtivos}
                    </p>
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-amber-400 mb-2">
                      <FileText className="w-4 h-4" />
                      <span className="text-sm">Boletos a Gerar</span>
                    </div>
                    <p className="text-2xl font-bold text-amber-400">
                      {preview.contratosParaGerar}
                    </p>
                  </div>

                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 md:col-span-2">
                    <div className="flex items-center gap-2 text-green-400 mb-2">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-sm">Valor Total</span>
                    </div>
                    <p className="text-2xl font-bold text-green-400">
                      {formatCurrency(preview.valorTotal)}
                    </p>
                  </div>
                </div>

                {/* Contratos List */}
                {preview.contratosParaGerar > 0 ? (
                  <div className="bg-neutral-800/30 border border-neutral-700 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedContratos(!expandedContratos)}
                      className="w-full flex items-center justify-between p-4 hover:bg-neutral-800/50 transition-colors"
                    >
                      <span className="font-medium text-neutral-200">
                        Ver contratos ({preview.contratosParaGerar})
                      </span>
                      {expandedContratos ? (
                        <ChevronUp className="w-5 h-5 text-neutral-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-neutral-400" />
                      )}
                    </button>

                    <AnimatePresence>
                      {expandedContratos && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="max-h-[300px] overflow-y-auto">
                            <table className="w-full">
                              <thead className="bg-neutral-800/50 sticky top-0">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">
                                    Cliente
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">
                                    Filial
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">
                                    Parcela
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">
                                    Vencimento
                                  </th>
                                  <th className="px-4 py-3 text-right text-xs font-medium text-neutral-400 uppercase">
                                    Valor
                                  </th>
                                  <th className="px-4 py-3 text-center text-xs font-medium text-neutral-400 uppercase">
                                    Dias
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-neutral-800">
                                {preview.contratos.map(
                                  (contrato: ContratoPreview) => (
                                    <tr
                                      key={contrato.contratoId}
                                      className="hover:bg-neutral-800/30 transition-colors"
                                    >
                                      <td className="px-4 py-3">
                                        <div>
                                          <p className="font-medium text-neutral-200 truncate max-w-[180px]">
                                            {contrato.clienteNome}
                                          </p>
                                          <p className="text-xs text-neutral-500">
                                            {contrato.clienteDocumento ||
                                              contrato.numeroPasta ||
                                              `#${contrato.contratoId}`}
                                          </p>
                                        </div>
                                      </td>
                                      <td className="px-4 py-3">
                                        <span className="text-xs text-neutral-400 truncate max-w-[100px] block">
                                          {contrato.filialNome || "-"}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3">
                                        <span
                                          className={`px-2 py-1 rounded text-sm ${
                                            contrato.totalParcelas === 0
                                              ? "bg-blue-500/20 text-blue-400"
                                              : "bg-neutral-700/50 text-neutral-300"
                                          }`}
                                        >
                                          {contrato.parcelaDescricao}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 text-neutral-300">
                                        {formatDate(contrato.dataVencimento)}
                                      </td>
                                      <td className="px-4 py-3 text-right font-medium text-neutral-200">
                                        {formatCurrency(contrato.valor)}
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        <span
                                          className={`px-2 py-1 rounded text-xs font-medium ${
                                            contrato.diasAteVencimento <= 3
                                              ? "bg-red-500/20 text-red-400"
                                              : contrato.diasAteVencimento <= 5
                                              ? "bg-amber-500/20 text-amber-400"
                                              : "bg-green-500/20 text-green-400"
                                          }`}
                                        >
                                          {contrato.diasAteVencimento}d
                                        </span>
                                      </td>
                                    </tr>
                                  )
                                )}
                              </tbody>
                            </table>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-neutral-300 mb-2">
                      Nenhum boleto para gerar
                    </h3>
                    <p className="text-neutral-500 max-w-md mx-auto mb-4">
                      Não há contratos com vencimento nos próximos 7 dias que
                      precisem de boleto gerado.
                    </p>
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 max-w-md mx-auto">
                      <p className="text-sm text-blue-400">
                        <strong>ℹ️ Janela de Geração:</strong> O sistema gera
                        boletos apenas quando faltam 7 dias ou menos para o
                        vencimento da parcela.
                      </p>
                    </div>
                  </div>
                )}

                {/* Info Box */}
                {preview.contratosParaGerar > 0 && (
                  <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                    <p className="text-sm text-blue-400">
                      <strong>ℹ️ Regras de Geração:</strong>
                    </p>
                    <ul className="text-xs text-blue-300/80 mt-2 space-y-1 list-disc list-inside">
                      <li>
                        Contratos com situação{" "}
                        <strong>&quot;CLIENTE&quot;</strong> são processados
                      </li>
                      <li>
                        Boletos são gerados quando faltam{" "}
                        <strong>7 dias ou menos</strong> para o vencimento
                      </li>
                      <li>Contratos correntes (∞) geram boleto todo mês</li>
                      <li>Baixa automática após 30 dias sem pagamento</li>
                    </ul>
                  </div>
                )}
              </>
            )}

            {/* Gerando Step */}
            {step === "gerando" && (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-20 h-20 border-4 border-amber-500/30 border-t-amber-500 rounded-full"
                  />
                  <Sparkles className="w-8 h-8 text-amber-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                </div>
                <h3 className="text-xl font-medium text-neutral-200 mt-6 mb-2">
                  Gerando boletos...
                </h3>
                <p className="text-neutral-500 text-center max-w-md">
                  Isso pode levar alguns minutos dependendo da quantidade de
                  boletos. Por favor, aguarde.
                </p>
              </div>
            )}

            {/* Resultado Step */}
            {step === "resultado" && resultado && (
              <>
                {/* Status Badge */}
                <div className="flex justify-center mb-6">
                  {getStatusBadge(resultado.status)}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-green-400 mb-2">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">Gerados</span>
                    </div>
                    <p className="text-2xl font-bold text-green-400">
                      {resultado.totalSucesso}
                    </p>
                  </div>

                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-red-400 mb-2">
                      <XCircle className="w-4 h-4" />
                      <span className="text-sm">Erros</span>
                    </div>
                    <p className="text-2xl font-bold text-red-400">
                      {resultado.totalErros}
                    </p>
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-amber-400 mb-2">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-sm">Valor Total</span>
                    </div>
                    <p className="text-2xl font-bold text-amber-400">
                      {formatCurrency(resultado.valorTotalGerado)}
                    </p>
                  </div>

                  <div className="bg-neutral-500/10 border border-neutral-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-neutral-400 mb-2">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">Duração</span>
                    </div>
                    <p className="text-2xl font-bold text-neutral-300">
                      {resultado.duracaoSegundos}s
                    </p>
                  </div>
                </div>

                {/* Boletos Gerados */}
                {resultado.boletosGerados.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-medium text-neutral-200 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      Boletos Gerados ({resultado.boletosGerados.length})
                    </h4>
                    <div className="bg-neutral-800/30 border border-neutral-700 rounded-xl overflow-hidden max-h-[200px] overflow-y-auto">
                      <table className="w-full">
                        <thead className="bg-neutral-800/50 sticky top-0">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-neutral-400 uppercase">
                              Cliente
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-neutral-400 uppercase">
                              Parcela
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-neutral-400 uppercase">
                              NSU
                            </th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-neutral-400 uppercase">
                              Valor
                            </th>
                            <th className="px-4 py-2 text-center text-xs font-medium text-neutral-400 uppercase">
                              Email
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800">
                          {resultado.boletosGerados.map((boleto) => (
                            <tr
                              key={boleto.boletoId}
                              className="hover:bg-neutral-800/30"
                            >
                              <td className="px-4 py-2 text-neutral-200 truncate max-w-[200px]">
                                {boleto.clienteNome}
                              </td>
                              <td className="px-4 py-2">
                                <span
                                  className={`px-2 py-0.5 rounded text-xs ${
                                    boleto.totalParcelas === 0
                                      ? "bg-blue-500/20 text-blue-400"
                                      : "bg-neutral-700/50 text-neutral-400"
                                  }`}
                                >
                                  {boleto.totalParcelas === 0
                                    ? `${boleto.numeroParcela}/∞`
                                    : `${boleto.numeroParcela}/${boleto.totalParcelas}`}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-neutral-400 font-mono text-sm">
                                {boleto.nsuCode}
                              </td>
                              <td className="px-4 py-2 text-right text-neutral-200">
                                {formatCurrency(boleto.valor)}
                              </td>
                              <td className="px-4 py-2 text-center">
                                {boleto.emailStatus === "ENVIADO" && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-400">
                                    <Mail className="w-3 h-3" />
                                    Enviado
                                  </span>
                                )}
                                {boleto.emailStatus === "SEM_EMAIL" && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-amber-500/20 text-amber-400">
                                    <MailWarning className="w-3 h-3" />
                                    Sem email
                                  </span>
                                )}
                                {boleto.emailStatus?.startsWith("FALHOU") && (
                                  <span
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400"
                                    title={boleto.emailStatus}
                                  >
                                    <MailX className="w-3 h-3" />
                                    Falhou
                                  </span>
                                )}
                                {!boleto.emailStatus && (
                                  <span className="text-neutral-500 text-xs">
                                    —
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Erros */}
                {resultado.erros.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-medium text-neutral-200 mb-3 flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-red-400" />
                      Erros ({resultado.erros.length})
                    </h4>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {resultado.erros.map((erro, index) => (
                        <div
                          key={index}
                          className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
                        >
                          <p className="font-medium text-red-400">
                            {erro.clienteNome}
                          </p>
                          <p className="text-sm text-red-300/70">{erro.erro}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resumo de Emails */}
                {resultado.resumoEmail && (
                  <div className="mb-6">
                    <h4 className="text-lg font-medium text-neutral-200 mb-3 flex items-center gap-2">
                      <Mail className="w-5 h-5 text-amber-400" />
                      Envio de Emails
                    </h4>

                    {/* Stats de Email */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3">
                        <div className="flex items-center gap-2 text-green-400 mb-1">
                          <Mail className="w-4 h-4" />
                          <span className="text-xs">Enviados</span>
                        </div>
                        <p className="text-xl font-bold text-green-400">
                          {resultado.resumoEmail.totalEnviados}
                        </p>
                      </div>

                      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                        <div className="flex items-center gap-2 text-red-400 mb-1">
                          <MailX className="w-4 h-4" />
                          <span className="text-xs">Falharam</span>
                        </div>
                        <p className="text-xl font-bold text-red-400">
                          {resultado.resumoEmail.totalFalharam}
                        </p>
                      </div>

                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
                        <div className="flex items-center gap-2 text-amber-400 mb-1">
                          <MailWarning className="w-4 h-4" />
                          <span className="text-xs">Sem Email</span>
                        </div>
                        <p className="text-xl font-bold text-amber-400">
                          {resultado.resumoEmail.totalSemEmail}
                        </p>
                      </div>
                    </div>

                    {/* Lista de clientes sem email */}
                    {resultado.resumoEmail.clientesSemEmail.length > 0 && (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                        <div className="flex items-start gap-2 mb-3">
                          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-amber-400">
                              Clientes sem email cadastrado
                            </p>
                            <p className="text-sm text-amber-300/70">
                              Atualize o cadastro desses clientes para envio
                              automático.
                            </p>
                          </div>
                        </div>
                        <div className="bg-neutral-950/50 rounded-lg p-3 max-h-[120px] overflow-y-auto">
                          <ul className="space-y-1">
                            {resultado.resumoEmail.clientesSemEmail.map(
                              (nome, idx) => (
                                <li
                                  key={idx}
                                  className="text-sm text-neutral-300 flex items-center gap-2"
                                >
                                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full flex-shrink-0" />
                                  {nome}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-neutral-900/95 border-t border-neutral-800 p-4 flex items-center justify-between">
            {step === "preview" && (
              <>
                <button
                  onClick={fetchPreview}
                  disabled={loading}
                  className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                  />
                  Atualizar
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={onClose}
                    className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 rounded-xl font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  {preview && preview.contratosParaGerar > 0 && (
                    <button
                      onClick={executarGeracao}
                      disabled={loading}
                      className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-neutral-950 rounded-xl font-semibold shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Confirmar Geração
                    </button>
                  )}
                </div>
              </>
            )}

            {step === "resultado" && (
              <div className="w-full flex justify-end">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-neutral-950 rounded-xl font-semibold shadow-lg shadow-amber-500/20 transition-all"
                >
                  Fechar
                </button>
              </div>
            )}

            {step === "gerando" && (
              <div className="w-full flex justify-center">
                <p className="text-sm text-neutral-500">
                  Aguarde, isso pode levar alguns minutos...
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
