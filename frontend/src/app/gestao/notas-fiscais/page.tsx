"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Search,
  Plus,
  Loader2,
  Download,
  Eye,
  Building2,
  Store,
  Calendar,
  XCircle,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import MainLayout from "@/components/MainLayout";
import { Tooltip } from "@/components";
import { PermissionWrapper } from "@/components/permissions";
import { cn, truncateText, formatDocumentoDisplay } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface NotaFiscal {
  numero?: string;
  dataEmissao?: string;
  tomador?: {
    cpfCnpj?: string;
    razaoSocial?: string;
    /** UF do tomador (sigla), quando a API de histórico enviar o campo */
    uf?: string;
  };
  servico?: {
    valorServicos?: number;
  };
  situacao?: string;
  id?: string;
  cnpjPrestador?: string;
  chaveAcesso?: string;
}

interface CancelarNFSeForm {
  codigoCancelamento: string;
  motivo: string;
}

interface FetchHistoricoParams {
  cnpj: string;
  dataInicio?: string;
  dataFim?: string;
}

// ─── Query key React Query ────────────────────────────────────────────────────
// Exportada para que a página de emissão invalide o cache via queryClient.
// Prefix matching: chamar com () invalida todas as variações por filtro de data.
export const NFSE_HISTORICO_QUERY_KEY = (filters?: {
  dataInicio?: string;
  dataFim?: string;
}) =>
  filters
    ? (["nfse-historico", filters.dataInicio ?? "", filters.dataFim ?? ""] as const)
    : (["nfse-historico"] as const);

/** Extrai UF do tomador a partir de possíveis formatos do payload do histórico NFS-e */
function mapTomadorUf(n: Record<string, unknown>): string | undefined {
  const tomador = n.tomador as Record<string, unknown> | undefined;
  const candidates = [
    n.ufTomador,
    n.tomadorUf,
    n.siglaUfTomador,
    n.siglaUFTomador,
    n.enderecoUfTomador,
    n.estadoTomador,
    n.siglaEstadoTomador,
    n.uf_tomador,
    n.uf,
    tomador?.uf,
    tomador?.siglaUf,
    tomador?.estado,
  ];
  for (const c of candidates) {
    if (c == null || c === "") continue;
    const s = String(c).trim().toUpperCase();
    if (!s) continue;
    if (/^[A-Z]{2}$/.test(s)) return s;
    if (s.length > 2 && /^[A-Z]{2}\b/.test(s)) return s.slice(0, 2);
  }
  return undefined;
}

// ─── Fetcher ──────────────────────────────────────────────────────────────────

const fetchHistorico = async (
  params: FetchHistoricoParams,
): Promise<NotaFiscal[]> => {
  const res = await fetch("/api/nfse/historico", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      metodo: "cnpj",
      cnpj: params.cnpj,
      dataInicio: params.dataInicio,
      dataFim: params.dataFim,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(formatarErroApi(data, "Erro ao buscar histórico"));

  console.log(
    `[fetchHistorico] CNPJ ${params.cnpj}:`,
    JSON.stringify(data, null, 2),
  );

  const rawList = Array.isArray(data) ? data : data.notas || data.data || [];
  const statusToSituacao = (s: unknown): string => {
    const n = Number(s);
    if (n === 1) return "Autorizada";
    if (n === 4) return "Cancelada";
    if (n === 3) return "Processando";
    return "Processando";
  };

  return (rawList as any[]).map((n) => {
    const valorServico =
      n.valorServicos != null
        ? Number(n.valorServicos)
        : n.valor_servicos != null
          ? Number(n.valor_servicos)
          : n.valorServico != null
            ? Number(n.valorServico)
            : undefined;

    return {
      id: String(n.id ?? ""),
      numero:
        n.numeroNfse || n.numero_nfse
          ? String(n.numeroNfse || n.numero_nfse)
          : undefined,
      dataEmissao: n.dataEmissao,
      situacao: statusToSituacao(n.statusEmissao),
      cnpjPrestador: params.cnpj.replace(/\D/g, ""),
      chaveAcesso: n.chaveAcesso ? String(n.chaveAcesso) : undefined,
      tomador: {
        razaoSocial: n.razaoSocialTomador,
        cpfCnpj: n.cnpjTomador,
        uf: mapTomadorUf(n as Record<string, unknown>),
      },
      servico:
        valorServico != null ? { valorServicos: valorServico } : undefined,
    };
  });
};

export const FILIAIS_CNPJ = {
  SP: "09039684000371",
  RJ: "09039684000100",
};

const FILIAIS = [
  { label: "Filial SP", cnpj: FILIAIS_CNPJ.SP, icon: Building2 },
  { label: "Filial RJ", cnpj: FILIAIS_CNPJ.RJ, icon: Store },
];

const PAGE_SIZE = 5;

const formatarErroAmigavel = (rawError: string | string[], def = "Erro desconhecido."): string => {
  if (!rawError) return def;
  const msg = Array.isArray(rawError) ? rawError.join(" | ") : String(rawError);

  if (msg.includes("Certificado") || msg.includes("The credentials supplied")) {
    return "Problema com o certificado digital da filial: não encontrado ou senha incorreta. Verifique se o .pfx está configurado no servidor.";
  }
  if (msg.includes("XML não compatível com Schema") || msg.includes("incomplete content")) {
    return "Falha na comunicação com a prefeitura: formato de dados incorreto ou incompleto. Verifique se os dados da nota estão corretos.";
  }
  if (msg.includes("Timeout") || msg.includes("TaskCanceledException")) {
    return "O sistema da prefeitura está instável e demorou muito para responder (Tempo Esgotado). Tente novamente mais tarde.";
  }
  if (msg.includes("ECONNREFUSED") || msg.includes("fetch failed")) {
    return "Sem conexão com a API do servidor interno. Verifique se o serviço está rodando.";
  }
  if (msg.includes("E0840")) {
    return "Esta nota já consta como processada/cancelada anteriormente.";
  }
  if (msg.includes("E160")) {
    return "Nota fiscal não encontrada no sistema da prefeitura.";
  }
  if (msg.includes("FK_") || msg.includes("REFERENCE constraint")) {
    return "Erro interno de banco de dados (Referência de exclusão inválida).";
  }

  return msg.replace("Erro ao cancelar NFS-e na Prefeitura de SP: ", "");
};

const formatarErroApi = (data: any, fallback: string) => {
  const requestId = typeof data?.requestId === "string" ? data.requestId : "";
  const base = formatarErroAmigavel(data?.error || fallback, fallback);
  return requestId ? `${base} (código: ${requestId})` : base;
};

// ─── Componente principal ─────────────────────────────────────────────────────

export default function NotasFiscaisPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNotaId, setSelectedNotaId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  // ── Modal de cancelamento ────────────────────────────────────────────────────
  const [cancelNotaId, setCancelNotaId] = useState<string | null>(null);
  const [cancelForm, setCancelForm] = useState<CancelarNFSeForm>({
    codigoCancelamento: "",
    motivo: "",
  });
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // ── Modal de deleção ─────────────────────────────────────────────────────────
  const [deleteNotaId, setDeleteNotaId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteConfirmStep, setDeleteConfirmStep] = useState<1 | 2>(1);

  const [filialErros, setFilialErros] = useState<string[]>([]);

  // ── React Query ─────────────────────────────────────────────────────────────
  // Busca todas as notas de AMBAS as filiais e une os resultados.
  const queryClient = useQueryClient();
  const queryKey = NFSE_HISTORICO_QUERY_KEY({ dataInicio, dataFim });
  const invalidateHistorico = () => queryClient.invalidateQueries({ queryKey });

  const {
    data: todasNotas = [],
    isLoading,
    error,
  } = useQuery<NotaFiscal[], Error>({
    queryKey,
    queryFn: async () => {
      const [resultSP, resultRJ] = await Promise.allSettled([
        fetchHistorico({ cnpj: FILIAIS_CNPJ.SP, dataInicio, dataFim }),
        fetchHistorico({ cnpj: FILIAIS_CNPJ.RJ, dataInicio, dataFim }),
      ]);

      const notasSP = resultSP.status === "fulfilled" ? resultSP.value : [];
      const notasRJ = resultRJ.status === "fulfilled" ? resultRJ.value : [];

      // Coleta nomes das filiais que falharam
      const falhas = [
        resultSP.status === "rejected" ? "Filial SP" : null,
        resultRJ.status === "rejected" ? "Filial RJ" : null,
      ].filter((f): f is string => f !== null);

      // Expõe erros parciais fora do fetcher via ref
      if (falhas.length > 0) {
        setTimeout(() => setFilialErros(falhas), 0);
        console.error(
          `[Histórico] Falha ao buscar: ${falhas.join(", ")}`,
          resultSP.status === "rejected" ? resultSP.reason : "",
          resultRJ.status === "rejected" ? resultRJ.reason : "",
        );
      } else {
        setTimeout(() => setFilialErros([]), 0);
      }

      const combined = [...notasSP, ...notasRJ];
      // Ordena de forma decrescente pela data de emissão
      combined.sort((a, b) => {
        const da = a.dataEmissao ? new Date(a.dataEmissao).getTime() : 0;
        const db = b.dataEmissao ? new Date(b.dataEmissao).getTime() : 0;
        return db - da;
      });

      return combined;
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 5_000,
  });

  const cancelNota = useMemo(
    () => todasNotas.find((n) => n.id === cancelNotaId) ?? null,
    [cancelNotaId, todasNotas],
  );

  const deleteNota = useMemo(
    () => todasNotas.find((n) => n.id === deleteNotaId) ?? null,
    [deleteNotaId, todasNotas],
  );

  // ── Filtros client-side ──────────────────────────────────────────────────────
  // Filial e busca textual filtram localmente (sem nova requisição ao banco).

  const filteredNotas = useMemo(() => {
    const term = searchTerm.toLowerCase();

    return todasNotas.filter((nota) => {
      const matchSearch =
        !term ||
        (nota.numero?.toLowerCase() || "").includes(term) ||
        (nota.tomador?.razaoSocial?.toLowerCase() || "").includes(term) ||
        (nota.tomador?.cpfCnpj?.toLowerCase() || "").includes(term) ||
        (nota.tomador?.uf?.toLowerCase() || "").includes(term);

      return matchSearch;
    });
  }, [todasNotas, searchTerm]);

  const selectedNota = useMemo(
    () => filteredNotas.find((n) => n.id === selectedNotaId) ?? null,
    [selectedNotaId, filteredNotas],
  );

  // ── Paginação ────────────────────────────────────────────────────────────────

  const totalPages = Math.max(1, Math.ceil(filteredNotas.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const paginatedNotas = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredNotas.slice(start, start + PAGE_SIZE);
  }, [filteredNotas, currentPage]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handleAplicarFiltroData = () => {
    setPage(1);
  };

  const handleLimparFiltroData = () => {
    setDataInicio("");
    setDataFim("");
    setPage(1);
  };

  const handleOpenCancelModal = (notaId: string) => {
    setCancelNotaId(notaId);
    setCancelForm({
      codigoCancelamento: "1", // padrão: "Erro na emissão"
      motivo: "",
    });
    setCancelError(null);
  };

  const handleCloseCancelModal = () => {
    setCancelNotaId(null);
    setCancelError(null);
  };

  const handleOpenDeleteModal = (notaId: string) => {
    setDeleteNotaId(notaId);
    setDeleteError(null);
    setDeleteConfirmStep(1);
  };

  const handleCloseDeleteModal = () => {
    setDeleteNotaId(null);
    setDeleteError(null);
    setDeleteConfirmStep(1);
  };

  const handleSubmitDelete = async () => {
    if (!deleteNota) return;

    // Se a nota não está Cancelada e ainda estamos na etapa 1,
    // avançar para a etapa de confirmação dupla.
    if (deleteNota.situacao !== "Cancelada" && deleteConfirmStep === 1) {
      setDeleteConfirmStep(2);
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      // Etapa A: Cancelar na prefeitura se ainda não estiver Cancelada
      if (deleteNota.situacao !== "Cancelada") {
        if (!deleteNota.chaveAcesso) {
          setDeleteError(
            "Chave de acesso não disponível. Não é possível cancelar esta nota automaticamente.",
          );
          setIsDeleting(false);
          return;
        }

        const cancelRes = await fetch("/api/nfse/cancelar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chaveAcesso: deleteNota.chaveAcesso,
            codigoCancelamento: "1", // Erro na emissão — padrão para deleção
            motivo: "Erro de emissão da NFS-e.",
          }),
        });

        const cancelData = await cancelRes.json();

        if (!cancelRes.ok) {
          const details = cancelData?.details as any;
          let rawError = "Falha ao cancelar a nota na prefeitura. O registro não foi apagado.";
          if (details?.erros && Array.isArray(details.erros) && details.erros.length > 0) {
            rawError = details.erros.join("\n");
          } else if (details?.mensagem) {
            rawError = details.mensagem;
          } else if (cancelData?.error) {
            rawError = cancelData.error;
          }

          setDeleteError(formatarErroApi({ ...cancelData, error: rawError }, rawError));
          setIsDeleting(false);
          return; // ← Aborta: não apaga do banco se cancelamento falhou
        }
      }

      // Etapa B: Apagar do banco local
      const deleteRes = await fetch("/api/nfse/deletar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notaId: deleteNota.id }),
      });

      const deleteData = await deleteRes.json();

      if (!deleteRes.ok) {
        const details = deleteData?.details as any;
        let rawError = "Erro ao apagar o registro do banco de dados.";
        if (details?.erros && Array.isArray(details.erros) && details.erros.length > 0) {
          rawError = details.erros.join("\n");
        } else if (details?.mensagem) {
          rawError = details.mensagem;
        } else if (deleteData?.error) {
          rawError = deleteData.error;
        }

        setDeleteError(formatarErroApi({ ...deleteData, error: rawError }, rawError));
        return;
      }

      toast.success("NFS-e cancelada e apagada com sucesso!");
      await invalidateHistorico();
      handleCloseDeleteModal();
    } catch (e: any) {
      setDeleteError(e.message || "Erro de conexão ao apagar.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmitCancel = async () => {
    if (!cancelNota?.chaveAcesso) {
      setCancelError("Chave de acesso não disponível para esta nota.");
      return;
    }
    if (!cancelForm.codigoCancelamento.trim()) {
      setCancelError("Código de cancelamento é obrigatório.");
      return;
    }
    if (cancelForm.motivo.trim() && cancelForm.motivo.trim().length < 15) {
      setCancelError("Motivo deve ter no mínimo 15 caracteres.");
      return;
    }

    setIsCancelling(true);
    setCancelError(null);

    try {
      const res = await fetch("/api/nfse/cancelar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chaveAcesso: cancelNota.chaveAcesso,
          codigoCancelamento: cancelForm.codigoCancelamento.trim(),
          motivo: cancelForm.motivo.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Verificar se a nota já foi cancelada anteriormente (E0840)
        const details = data?.details as any;
        let rawError = "Falha ao cancelar a nota.";
        if (details?.erros && Array.isArray(details.erros) && details.erros.length > 0) {
          rawError = details.erros.join("\n");
        } else if (details?.mensagem) {
          rawError = details.mensagem;
        } else if (data?.error) {
          rawError = data.error;
        }

        setCancelError(formatarErroApi({ ...data, error: rawError }, rawError));
        return;
      }

      toast.success("NFS-e cancelada com sucesso!");
      await invalidateHistorico();
      handleCloseCancelModal();
    } catch (e: any) {
      setCancelError(e.message || "Erro de conexão ao cancelar.");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDownloadPdf = async (notaId: string) => {
    if (!notaId) return;
    const toastId = toast.loading("Baixando PDF...");
    try {
      const res = await fetch("/api/nfse/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notaId }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(formatarErroApi(errData, "Falha no download"));
      }

      const blob = await res.blob();
      if (blob.size === 0) throw new Error("PDF vazio recebido.");

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `NFSe_${notaId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Download iniciado!", { id: toastId });
    } catch (e: any) {
      toast.error(e.message, { id: toastId });
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <PermissionWrapper modulo="Cliente" acao="Visualizar">
      <MainLayout>
        <div className="p-6 max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
          >
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <FileText className="w-8 h-8 text-amber-500" />
                </div>
                <h1 className="text-3xl font-bold text-neutral-100 tracking-tight">
                  Gestão de Notas Fiscais
                </h1>
              </div>
              <p className="text-neutral-400 text-sm font-medium">
                Monitore e gerencie todas as emissões de NFS-e da sua empresa
              </p>
            </div>

            <Link href="/gestao/notas-fiscais/nova">
              <motion.button
                whileHover={{ scale: 1.02, translateY: -2 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 rounded-xl font-bold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all duration-300 group"
              >
                <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
                Nova Nota Fiscal
              </motion.button>
            </Link>
          </motion.div>

          {/* Filtros */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col gap-4"
          >
            {/* Linha 1: busca + toggle filial */}
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="relative w-full lg:max-w-md group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-amber-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Buscar por nome, CPF/CNPJ ou número..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            {/* Linha 2: filtros de data */}
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-neutral-500 font-medium">
                  Data início
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="pl-9 pr-4 py-2.5 bg-neutral-800/50 border border-neutral-700 rounded-xl text-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-neutral-500 font-medium">
                  Data fim
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    className="pl-9 pr-4 py-2.5 bg-neutral-800/50 border border-neutral-700 rounded-xl text-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleAplicarFiltroData}
                className="px-5 py-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl text-sm font-semibold hover:bg-amber-500/20 transition-all"
              >
                Aplicar
              </button>

              {(dataInicio || dataFim) && (
                <button
                  type="button"
                  onClick={handleLimparFiltroData}
                  className="px-5 py-2.5 bg-neutral-800/50 border border-neutral-700 text-neutral-400 rounded-xl text-sm font-semibold hover:bg-neutral-800 transition-all"
                >
                  Limpar
                </button>
              )}
            </div>
          </motion.div>

          {filialErros.length > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm text-amber-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                Não foi possível carregar as notas de:{" "}
                <strong>{filialErros.join(", ")}</strong>. Verifique se há notas
                emitidas.
              </span>
              <button
                type="button"
                onClick={() => invalidateHistorico()}
                className="ml-auto text-xs font-semibold underline hover:text-amber-300"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {/* Tabela */}
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
                <p className="text-neutral-400 animate-pulse">
                  Carregando notas fiscais...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-red-400 font-medium">
                {error.message || "Erro ao carregar notas fiscais."}
              </p>
              <button
                type="button"
                onClick={() => invalidateHistorico()}
                className="mt-4 px-5 py-2 bg-neutral-800 text-amber-400 rounded-xl text-sm font-semibold hover:bg-neutral-700 transition-all"
              >
                Tentar novamente
              </button>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-neutral-900/95 backdrop-blur-xl rounded-2xl shadow-xl border border-neutral-800 overflow-hidden"
            >
              {/* Cabeçalho da tabela com paginação */}
              <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-100">
                  Histórico de Emissões ({filteredNotas.length})
                </h3>
                <div className="flex items-center gap-3">
                  <div className="text-xs text-neutral-400">
                    Exibindo{" "}
                    {filteredNotas.length === 0
                      ? 0
                      : (currentPage - 1) * PAGE_SIZE + 1}
                    –{Math.min(currentPage * PAGE_SIZE, filteredNotas.length)}{" "}
                    de {filteredNotas.length}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-neutral-800 bg-neutral-800/40 text-neutral-300 hover:bg-neutral-800/70 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <span className="text-xs text-neutral-400 min-w-[88px] text-center">
                      Página {currentPage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage >= totalPages}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-neutral-800 bg-neutral-800/40 text-neutral-300 hover:bg-neutral-800/70 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Próxima
                    </button>
                  </div>
                </div>
              </div>

              {/* Conteúdo da tabela */}
              {filteredNotas.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-20 h-20 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FileText className="w-10 h-10 text-neutral-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-200 mb-2">
                    Nenhuma nota encontrada
                  </h3>
                  <p className="text-neutral-400 max-w-sm mx-auto">
                    {searchTerm
                      ? "Não encontramos notas para os filtros atuais. Tente ajustar sua busca."
                      : "Este prestador ainda não possui notas emitidas no sistema."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-800/30 border-b border-neutral-800">
                      <tr>
                        {[
                          "Data Emissão",
                          "Tomador",
                          "Valor (R$)",
                          "Status",
                          "Ações",
                        ].map((col) => (
                          <th
                            key={col}
                            className={cn(
                              "px-6 py-4 text-xs font-bold text-amber-500 uppercase tracking-wider",
                              col === "Ações" ? "text-right" : "text-left",
                            )}
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                      {paginatedNotas.map((nota, index) => (
                        <motion.tr
                          key={nota.id || nota.numero || index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.05 * index }}
                          className="transition-all duration-200 hover:bg-neutral-800/30 border-l-4 border-transparent"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-400">
                            {nota.dataEmissao
                              ? new Date(nota.dataEmissao).toLocaleDateString(
                                  "pt-BR",
                                )
                              : "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/20 mr-3">
                                <span className="text-sm font-bold text-neutral-950">
                                  {(nota.tomador?.razaoSocial || "D")
                                    .charAt(0)
                                    .toUpperCase()}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <div className="text-sm font-semibold text-neutral-200">
                                  <Tooltip
                                    content={
                                      nota.tomador?.razaoSocial ||
                                      "Desconhecido"
                                    }
                                  >
                                    <span className="cursor-help transition-colors hover:text-amber-400">
                                      {truncateText(
                                        nota.tomador?.razaoSocial ||
                                          "Desconhecido",
                                        30,
                                      )}
                                    </span>
                                  </Tooltip>
                                </div>
                                <div className="text-[11px] text-neutral-400 font-semibold uppercase tracking-wide mt-0.5">
                                  UF {nota.tomador?.uf || "—"}
                                </div>
                                <div className="text-xs text-neutral-500 font-medium">
                                  {formatDocumentoDisplay(
                                    nota.tomador?.cpfCnpj,
                                  ) || "—"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-bold text-green-400">
                            {nota.servico?.valorServicos?.toLocaleString(
                              "pt-BR",
                              { style: "currency", currency: "BRL" },
                            ) || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={cn(
                                "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                                nota.situacao === "Autorizada"
                                  ? "bg-green-500/10 text-green-400 border-green-500/20"
                                  : nota.situacao === "Cancelada"
                                    ? "bg-red-500/10 text-red-400 border-red-500/20"
                                    : "bg-amber-500/10 text-amber-400 border-amber-500/20",
                              )}
                            >
                              {nota.situacao || "Processando"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedNotaId(nota.id || null);
                              }}
                              disabled={!nota.id}
                              className="p-2 mr-2 bg-neutral-800 text-amber-500 hover:bg-amber-500 hover:text-neutral-950 rounded-lg transition-all border border-neutral-700 disabled:opacity-20"
                              title="Ver detalhes"
                            >
                              <Eye className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadPdf(nota.id || "");
                              }}
                              disabled={!nota.id}
                              className="p-2 bg-neutral-800 text-amber-500 hover:bg-amber-500 hover:text-neutral-950 rounded-lg transition-all border border-neutral-700 disabled:opacity-20"
                              title="Baixar XML"
                            >
                              <Download className="w-4 h-4" />
                            </motion.button>

                            {nota.situacao === "Autorizada" && (
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenCancelModal(nota.id || "");
                                }}
                                disabled={!nota.id}
                                className="p-2 ml-2 bg-neutral-800 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all border border-neutral-700 disabled:opacity-20"
                                title="Cancelar NFS-e"
                              >
                                <XCircle className="w-4 h-4" />
                              </motion.button>
                            )}

                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDeleteModal(nota.id || "");
                              }}
                              disabled={!nota.id}
                              className="p-2 ml-2 bg-neutral-800 text-neutral-400 hover:bg-red-900/60 hover:text-red-300 rounded-lg transition-all border border-neutral-700 disabled:opacity-20"
                              title="Apagar NFS-e"
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

          <AnimatePresence>
            {selectedNota && (
              <>
                <motion.div
                  key="nfse-detalhes-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999]"
                  onClick={() => setSelectedNotaId(null)}
                />
                <motion.div
                  key="nfse-detalhes-modal"
                  initial={{ opacity: 0, scale: 0.98, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: 10 }}
                  className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
                >
                  <div className="w-full max-w-2xl bg-neutral-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-neutral-800 overflow-hidden">
                    <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-neutral-100">
                          Detalhes da NFS-e
                        </h3>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          ID: {selectedNota.id}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedNotaId(null)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-neutral-800 bg-neutral-800/40 text-neutral-300 hover:bg-neutral-800/70"
                      >
                        Fechar
                      </button>
                    </div>

                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-neutral-950/40 border border-neutral-800 rounded-xl p-4">
                        <p className="text-[11px] text-neutral-500 font-semibold uppercase tracking-wider">
                          Número da Nota
                        </p>
                        <p className="text-sm text-neutral-100 font-bold mt-1">
                          {selectedNota.numero || "—"}
                        </p>
                      </div>

                      <div className="bg-neutral-950/40 border border-neutral-800 rounded-xl p-4">
                        <p className="text-[11px] text-neutral-500 font-semibold uppercase tracking-wider">
                          Data de Emissão
                        </p>
                        <p className="text-sm text-neutral-200 mt-1">
                          {selectedNota.dataEmissao
                            ? new Date(selectedNota.dataEmissao).toLocaleString(
                                "pt-BR",
                              )
                            : "—"}
                        </p>
                      </div>

                      <div className="bg-neutral-950/40 border border-neutral-800 rounded-xl p-4 sm:col-span-2">
                        <p className="text-[11px] text-neutral-500 font-semibold uppercase tracking-wider">
                          Tomador
                        </p>
                        <p className="text-sm text-neutral-200 mt-1">
                          {selectedNota.tomador?.razaoSocial || "—"}
                        </p>
                        <p className="text-xs text-neutral-400 font-semibold uppercase tracking-wide mt-1">
                          UF {selectedNota.tomador?.uf || "—"}
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">
                          {formatDocumentoDisplay(
                            selectedNota.tomador?.cpfCnpj,
                          ) || "—"}
                        </p>
                      </div>

                      <div className="bg-neutral-950/40 border border-neutral-800 rounded-xl p-4">
                        <p className="text-[11px] text-neutral-500 font-semibold uppercase tracking-wider">
                          Status
                        </p>
                        <p className="text-sm text-neutral-200 mt-1">
                          {selectedNota.situacao || "—"}
                        </p>
                      </div>

                      <div className="bg-neutral-950/40 border border-neutral-800 rounded-xl p-4">
                        <p className="text-[11px] text-neutral-500 font-semibold uppercase tracking-wider">
                          Valor de Serviços
                        </p>
                        <p className="text-sm text-neutral-200 mt-1">
                          {selectedNota.servico?.valorServicos != null
                            ? selectedNota.servico.valorServicos.toLocaleString(
                                "pt-BR",
                                {
                                  style: "currency",
                                  currency: "BRL",
                                },
                              )
                            : "—"}
                        </p>
                      </div>

                      <div className="bg-neutral-950/40 border border-neutral-800 rounded-xl p-4 sm:col-span-2">
                        <p className="text-[11px] text-neutral-500 font-semibold uppercase tracking-wider">
                          Prestador (CNPJ)
                        </p>
                        <p className="text-sm text-neutral-200 mt-1">
                          {formatDocumentoDisplay(selectedNota.cnpjPrestador) ||
                            selectedNota.cnpjPrestador ||
                            "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* ── Modal de Cancelamento ────────────────────────────────────── */}
          <AnimatePresence>
            {cancelNota && (
              <>
                <motion.div
                  key="cancel-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999]"
                  onClick={handleCloseCancelModal}
                />
                <motion.div
                  key="cancel-modal"
                  initial={{ opacity: 0, scale: 0.98, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: 10 }}
                  className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
                >
                  <div className="w-full max-w-lg bg-neutral-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-neutral-800 overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500/10 rounded-lg">
                          <AlertTriangle className="w-5 h-5 text-red-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-neutral-100">
                            Cancelar NFS-e
                          </h3>
                          <p className="text-xs text-neutral-400 mt-0.5">
                            Nota nº {cancelNota.numero || cancelNota.id}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleCloseCancelModal}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-neutral-800 bg-neutral-800/40 text-neutral-300 hover:bg-neutral-800/70"
                      >
                        Fechar
                      </button>
                    </div>

                    {/* Aviso */}
                    <div className="mx-6 mt-5 flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-400">
                        Esta ação é irreversível. A nota fiscal será cancelada
                        junto à prefeitura e não poderá ser reativada.
                      </p>
                    </div>

                    {/* Formulário */}
                    <div className="p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                          Justificativa de Cancelamento{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={cancelForm.codigoCancelamento}
                          onChange={(e) =>
                            setCancelForm((prev) => ({
                              ...prev,
                              codigoCancelamento: e.target.value,
                            }))
                          }
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-neutral-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all text-sm"
                        >
                          <option value="1">1 — Erro na emissão</option>
                          <option value="2">2 — Serviço não prestado</option>
                          <option value="3">3 — Duplicidade da nota</option>
                          <option value="4">4 — Erro de valores</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                          Motivo{" "}
                          <span className="text-neutral-500 text-xs font-normal">
                            (opcional, mín. 15 caracteres)
                          </span>
                        </label>
                        <textarea
                          value={cancelForm.motivo}
                          onChange={(e) =>
                            setCancelForm((prev) => ({
                              ...prev,
                              motivo: e.target.value,
                            }))
                          }
                          placeholder="Descreva o motivo do cancelamento..."
                          rows={3}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-neutral-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all text-sm resize-none"
                        />
                        {cancelForm.motivo.length > 0 &&
                          cancelForm.motivo.length < 15 && (
                            <p className="text-xs text-amber-400 mt-1">
                              {15 - cancelForm.motivo.length} caracteres
                              restantes
                            </p>
                          )}
                      </div>

                      {/* Erro */}
                      {cancelError && (
                        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                          <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                          <p className="text-xs text-red-400">{cancelError}</p>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 pb-6 flex gap-3 justify-end">
                      <button
                        type="button"
                        onClick={handleCloseCancelModal}
                        disabled={isCancelling}
                        className="px-5 py-2.5 text-sm font-semibold rounded-lg border border-neutral-700 bg-neutral-800/50 text-neutral-300 hover:bg-neutral-800 transition-all disabled:opacity-50"
                      >
                        Voltar
                      </button>
                      <button
                        type="button"
                        onClick={handleSubmitCancel}
                        disabled={
                          isCancelling || !cancelForm.codigoCancelamento.trim()
                        }
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/20"
                      >
                        {isCancelling ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Cancelando...
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" />
                            Confirmar Cancelamento
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* ── Modal de Deleção ─────────────────────────────────────────── */}
          <AnimatePresence>
            {deleteNota && (
              <>
                <motion.div
                  key="delete-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999]"
                  onClick={handleCloseDeleteModal}
                />
                <motion.div
                  key="delete-modal"
                  initial={{ opacity: 0, scale: 0.98, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: 10 }}
                  className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
                >
                  <div className="w-full max-w-lg bg-neutral-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-neutral-800 overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500/10 rounded-lg">
                          <Trash2 className="w-5 h-5 text-red-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-neutral-100">
                            Apagar NFS-e
                          </h3>
                          <p className="text-xs text-neutral-400 mt-0.5">
                            Nota nº {deleteNota.numero || deleteNota.id}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleCloseDeleteModal}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-neutral-800 bg-neutral-800/40 text-neutral-300 hover:bg-neutral-800/70"
                      >
                        Fechar
                      </button>
                    </div>

                    {/* Corpo — Etapa 1: nota já Cancelada */}
                    {deleteNota.situacao === "Cancelada" && (
                      <div className="p-6 space-y-4">
                        <div className="flex items-start gap-3 p-3 bg-neutral-800/50 border border-neutral-700 rounded-xl">
                          <AlertTriangle className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                          <p className="text-sm text-neutral-300">
                            Esta nota já está{" "}
                            <span className="font-semibold text-red-400">
                              Cancelada
                            </span>
                            . O registro será apagado permanentemente do banco
                            de dados. Esta ação é irreversível.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Corpo — Etapa 1: nota NÃO cancelada */}
                    {deleteNota.situacao !== "Cancelada" &&
                      deleteConfirmStep === 1 && (
                        <div className="p-6 space-y-4">
                          <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <p className="text-sm text-red-300 font-semibold">
                                Atenção: esta nota ainda está{" "}
                                {deleteNota.situacao || "ativa"}.
                              </p>
                              <p className="text-xs text-red-400">
                                Para apagá-la, o sistema irá primeiro{" "}
                                <span className="font-bold">
                                  cancelar a nota junto à prefeitura
                                </span>{" "}
                                e em seguida remover o registro do banco de
                                dados. Se o cancelamento falhar, nenhuma
                                alteração será feita.
                              </p>
                            </div>
                          </div>
                          <p className="text-sm text-neutral-400">
                            Deseja continuar com o cancelamento e exclusão?
                          </p>
                        </div>
                      )}

                    {/* Corpo — Etapa 2: confirmação dupla */}
                    {deleteNota.situacao !== "Cancelada" &&
                      deleteConfirmStep === 2 && (
                        <div className="p-6 space-y-4">
                          <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <p className="text-sm text-red-300 font-bold">
                                Confirmação final — esta ação é irreversível.
                              </p>
                              <p className="text-xs text-red-400">
                                A nota será{" "}
                                <span className="font-bold">
                                  cancelada na prefeitura
                                </span>{" "}
                                com código 1 (Erro na emissão) e o registro será{" "}
                                <span className="font-bold">
                                  permanentemente apagado
                                </span>{" "}
                                do banco de dados.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                    {/* Erro */}
                    {deleteError && (
                      <div className="mx-6 mb-4 flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                        <p className="text-xs text-red-400">{deleteError}</p>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="px-6 pb-6 flex gap-3 justify-end">
                      <button
                        type="button"
                        onClick={handleCloseDeleteModal}
                        disabled={isDeleting}
                        className="px-5 py-2.5 text-sm font-semibold rounded-lg border border-neutral-700 bg-neutral-800/50 text-neutral-300 hover:bg-neutral-800 transition-all disabled:opacity-50"
                      >
                        Voltar
                      </button>
                      <button
                        type="button"
                        onClick={handleSubmitDelete}
                        disabled={isDeleting}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-lg bg-red-700 hover:bg-red-800 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/20"
                      >
                        {isDeleting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {deleteNota.situacao !== "Cancelada" &&
                            deleteConfirmStep === 1
                              ? "Processando..."
                              : "Apagando..."}
                          </>
                        ) : deleteNota.situacao !== "Cancelada" &&
                          deleteConfirmStep === 1 ? (
                          <>
                            <AlertTriangle className="w-4 h-4" />
                            Entendido, continuar
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4" />
                            Confirmar e Apagar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </MainLayout>
    </PermissionWrapper>
  );
}
