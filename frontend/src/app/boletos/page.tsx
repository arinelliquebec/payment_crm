// src/app/boletos/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBoletos } from "@/hooks/useBoletos";
import { BoletoCard } from "@/components/boletos/BoletoCard";
import {
  Boleto,
  BoletoStatus,
  BoletoFilters,
  verificarSeFoiPago,
  normalizarStatusBoleto,
} from "@/types/boleto";
import { StatusBadge } from "@/components/boletos/StatusBadge";
import { NovoBoletoModal } from "@/components/boletos/NovoBoletoModal";
import { SincronizarTodosButton } from "@/components/boletos/SincronizarTodosButton";
import { BoletoDetailsModal } from "@/components/boletos/BoletoDetailsModal";
import { GerarBoletosLoteModal } from "@/components/boletos/GerarBoletosLoteModal";
import { EnviarEmailModal } from "@/components/boletos/EnviarEmailModal";
import MainLayout from "@/components/MainLayout";
import {
  Plus,
  Search,
  Filter,
  RefreshCw,
  FileText,
  Calendar,
  DollarSign,
  User,
  Building,
  CreditCard,
  Download,
  Eye,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  ChevronDown,
  Sparkles,
  TrendingUp,
  Receipt,
  ArrowUpDown,
  Layers,
  Mail,
  FileSpreadsheet,
  FileDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { formatDate } from "date-fns";
import { cn } from "@/lib/utils";

export default function BoletosPage() {
  const {
    boletos,
    listagemResumo,
    loading,
    error,
    fetchBoletos,
    syncBoleto,
    deleteBoleto,
    clearError,
  } = useBoletos();

  const [filters, setFilters] = useState<BoletoFilters>({});
  const [localStatusFilter, setLocalStatusFilter] = useState<string>(""); // Filtro local para "PAGO" e "EXPIRADO"
  const [vencimentoDiaExato, setVencimentoDiaExato] = useState(false); // Checkbox para filtrar dia exato de vencimento
  const [emissaoDiaExato, setEmissaoDiaExato] = useState(false); // Checkbox para filtrar dia exato de emissão
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"name" | "date" | "value" | "status">(
    "name",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedBoleto, setSelectedBoleto] = useState<Boleto | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showNewBoletoModal, setShowNewBoletoModal] = useState(false);
  const [showGerarLoteModal, setShowGerarLoteModal] = useState(false);
  const [showEnviarEmailModal, setShowEnviarEmailModal] = useState(false);
  const [boletoParaEmail, setBoletoParaEmail] = useState<Boleto | null>(null);
  const [downloadingPdfId, setDownloadingPdfId] = useState<number | null>(null);
  const [downloadingPdfName, setDownloadingPdfName] = useState<string>("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchBoletos();
  }, []);

  // Funções de exportação
  const exportToExcel = async () => {
    setExporting(true);
    try {
      // Preparar dados para exportação
      const dataToExport = sortedBoletos.map((boleto) => ({
        ID: boleto.id,
        Cliente: boleto.contrato?.clienteNome || boleto.payerName || "-",
        Contrato: boleto.contrato?.numeroContrato || "-",
        Valor: boleto.nominalValue,
        "Valor Pago": boleto.paidValue || 0,
        Vencimento: new Date(boleto.dueDate).toLocaleDateString("pt-BR"),
        Status: boleto.status,
        Pago: verificarSeFoiPago(boleto) ? "Sim" : "Não",
        NSU: boleto.nsuCode || "-",
      }));

      // Criar CSV (formato compatível com Excel)
      const headers = Object.keys(dataToExport[0] || {});
      const csvContent = [
        headers.join(";"),
        ...dataToExport.map((row) =>
          headers
            .map((header) => {
              const value = row[header as keyof typeof row];
              if (typeof value === "number") {
                return value.toString().replace(".", ",");
              }
              return `"${value}"`;
            })
            .join(";"),
        ),
      ].join("\n");

      // Download
      const blob = new Blob(["\ufeff" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `boletos_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Erro ao exportar para Excel:", error);
      alert("Erro ao exportar para Excel");
    } finally {
      setExporting(false);
      setShowExportMenu(false);
    }
  };

  const exportToPDF = async () => {
    setExporting(true);
    try {
      const resumoApiHtml =
        listagemResumo !== null
          ? `
            <p><strong>Resumo (API):</strong></p>
            <p>Total de boletos: ${listagemResumo.total}</p>
            <p>Valor total: R$ ${listagemResumo.valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
            <p>Total pago: R$ ${listagemResumo.totalPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
            <p>Pendentes: ${listagemResumo.pendentes}</p>
            <p>Pagos: ${listagemResumo.pagos}</p>
            <p>Vencidos: ${listagemResumo.vencidos}</p>`
          : `
            <p><strong>Resumo (API):</strong> não disponível nesta consulta.</p>`;

      // Criar conteúdo HTML para impressão/PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Relatório de Boletos</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; }
            h1 { color: #333; font-size: 18px; margin-bottom: 5px; }
            .subtitle { color: #666; font-size: 12px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            tr:nth-child(even) { background-color: #fafafa; }
            .text-right { text-align: right; }
            .status-pago { color: #16a34a; font-weight: bold; }
            .status-pendente { color: #d97706; }
            .status-vencido { color: #dc2626; }
            .summary { margin-top: 20px; padding: 10px; background: #f5f5f5; border-radius: 4px; }
            .summary p { margin: 5px 0; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <h1>Relatório de Boletos</h1>
          <p class="subtitle">Gerado em ${new Date().toLocaleString("pt-BR")} | Total: ${sortedBoletos.length} boletos</p>
          
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Contrato</th>
                <th>Vencimento</th>
                <th class="text-right">Valor</th>
                <th>Status</th>
                <th>Pago</th>
              </tr>
            </thead>
            <tbody>
              ${sortedBoletos
                .map(
                  (boleto) => `
                <tr>
                  <td>${boleto.id}</td>
                  <td>${boleto.contrato?.clienteNome || boleto.payerName || "-"}</td>
                  <td>${boleto.contrato?.numeroContrato || "-"}</td>
                  <td>${new Date(boleto.dueDate).toLocaleDateString("pt-BR")}</td>
                  <td class="text-right">R$ ${boleto.nominalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                  <td class="${boleto.status === "LIQUIDADO" || boleto.status === "BAIXADO" ? "status-pago" : boleto.status === "VENCIDO" ? "status-vencido" : "status-pendente"}">${boleto.status}</td>
                  <td>${verificarSeFoiPago(boleto) ? "✓ Sim" : "Não"}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
          
          <div class="summary">
            ${resumoApiHtml}
            <p><strong>Boletos neste arquivo:</strong> ${sortedBoletos.length}</p>
          </div>
        </body>
        </html>
      `;

      // Abrir em nova janela para impressão/PDF
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    } catch (error) {
      console.error("Erro ao exportar para PDF:", error);
      alert("Erro ao exportar para PDF");
    } finally {
      setExporting(false);
      setShowExportMenu(false);
    }
  };

  const exportToWord = async () => {
    setExporting(true);
    try {
      const resumoApiHtmlWord =
        listagemResumo !== null
          ? `
          <p><strong>Resumo (API):</strong></p>
          <p>Total de boletos: ${listagemResumo.total}</p>
          <p>Valor total: R$ ${listagemResumo.valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          <p>Total pago: R$ ${listagemResumo.totalPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          <p>Pendentes: ${listagemResumo.pendentes}</p>
          <p>Pagos: ${listagemResumo.pagos}</p>
          <p>Vencidos: ${listagemResumo.vencidos}</p>`
          : `
          <p><strong>Resumo (API):</strong> não disponível nesta consulta.</p>`;

      // Criar conteúdo HTML para Word
      const htmlContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
        <head>
          <meta charset="utf-8">
          <title>Relatório de Boletos</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 11pt; }
            h1 { color: #333; font-size: 16pt; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #000; padding: 5px; }
            th { background-color: #f0f0f0; }
            .text-right { text-align: right; }
          </style>
        </head>
        <body>
          <h1>Relatório de Boletos</h1>
          <p>Gerado em: ${new Date().toLocaleString("pt-BR")}</p>
          <p>Total de boletos: ${sortedBoletos.length}</p>
          <br>
          
          <table>
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Contrato</th>
              <th>Vencimento</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Pago</th>
            </tr>
            ${sortedBoletos
              .map(
                (boleto) => `
              <tr>
                <td>${boleto.id}</td>
                <td>${boleto.contrato?.clienteNome || boleto.payerName || "-"}</td>
                <td>${boleto.contrato?.numeroContrato || "-"}</td>
                <td>${new Date(boleto.dueDate).toLocaleDateString("pt-BR")}</td>
                <td class="text-right">R$ ${boleto.nominalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                <td>${boleto.status}</td>
                <td>${verificarSeFoiPago(boleto) ? "Sim" : "Não"}</td>
              </tr>
            `,
              )
              .join("")}
          </table>
          
          <br>
          ${resumoApiHtmlWord}
          <p><strong>Boletos neste arquivo:</strong> ${sortedBoletos.length}</p>
        </body>
        </html>
      `;

      // Download como .doc
      const blob = new Blob(["\ufeff" + htmlContent], {
        type: "application/msword",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `boletos_${new Date().toISOString().split("T")[0]}.doc`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Erro ao exportar para Word:", error);
      alert("Erro ao exportar para Word");
    } finally {
      setExporting(false);
      setShowExportMenu(false);
    }
  };

  // Fechar menu de exportação ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showExportMenu) {
        const target = event.target as HTMLElement;
        if (!target.closest("[data-export-menu]")) {
          setShowExportMenu(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showExportMenu]);

  const handleSync = async (boleto: Boleto) => {
    // Não sincronizar boletos já pagos ou cancelados
    if (verificarSeFoiPago(boleto) || boleto.status === "CANCELADO") return;

    setSyncingId(boleto.id);
    try {
      await syncBoleto(boleto.id);
      await fetchBoletos();
    } catch (error) {
      console.error("Erro ao sincronizar boleto:", error);
    } finally {
      setSyncingId(null);
    }
  };

  const handleDelete = async (boleto: Boleto) => {
    // Não permitir deletar boletos pagos
    if (verificarSeFoiPago(boleto)) return;

    if (!confirm(`Deseja realmente cancelar o boleto #${boleto.id}?`)) {
      return;
    }

    setDeletingId(boleto.id);
    try {
      await deleteBoleto(boleto.id);
      await fetchBoletos();
    } catch (error) {
      console.error("Erro ao cancelar boleto:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleViewDetails = (boleto: Boleto) => {
    setSelectedBoleto(boleto);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedBoleto(null);
  };

  const handleSendEmail = (boleto: Boleto) => {
    setBoletoParaEmail(boleto);
    setShowEnviarEmailModal(true);
  };

  const closeEnviarEmailModal = () => {
    setShowEnviarEmailModal(false);
    setBoletoParaEmail(null);
  };

  const handleDownloadPdf = async (boleto: Boleto) => {
    // Permitir download apenas para boletos não pagos e não cancelados
    const isPago = verificarSeFoiPago(boleto);
    if (isPago || boleto.status === "CANCELADO") {
      alert(
        "⚠️ Apenas boletos não pagos podem ter o PDF baixado.\n\nBoletos pagos ou cancelados não estão mais disponíveis na API do Santander.",
      );
      return;
    }

    setDownloadingPdfId(boleto.id);
    setDownloadingPdfName(boleto.payerName);

    try {
      // Importar dinamicamente para evitar problemas de SSR
      const { getApiUrl } = await import("@/../env.config");
      const apiUrl = getApiUrl();
      const token = localStorage.getItem("token");

      const response = await fetch(`${apiUrl}/Boleto/${boleto.id}/pdf`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erro ao baixar PDF:", response.status, errorText);

        // Mensagem de erro genérica (boleto já foi validado como REGISTRADO)
        let errorMessage = "⚠️ Erro ao baixar PDF do boleto.\n\n";
        errorMessage += "Possíveis causas:\n";
        errorMessage += "• Pode haver um problema temporário com o banco\n";
        errorMessage += "• O boleto pode estar em processamento\n";
        errorMessage += "• Tente novamente em alguns instantes";

        alert(errorMessage);
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Boleto_${boleto.id}_${boleto.payerName.replace(
        /[^a-zA-Z0-9]/g,
        "_",
      )}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Erro ao baixar PDF:", error);

      let errorMessage = "Erro ao baixar PDF do boleto.\n\n";
      errorMessage += "Verifique sua conexão e tente novamente.\n";
      errorMessage +=
        "Se o problema persistir, entre em contato com o suporte.";

      alert(errorMessage);
    } finally {
      setDownloadingPdfId(null);
      setDownloadingPdfName("");
    }
  };

  const handleFilterChange = (key: keyof BoletoFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const applyFilters = () => {
    const apiFilters: BoletoFilters = { ...filters };
    // VENCIDO e PENDENTE são critérios compostos no front; a API costuma filtrar só pelo campo status literal
    if (apiFilters.status === "VENCIDO" || apiFilters.status === "PENDENTE") {
      delete apiFilters.status;
    }
    fetchBoletos(apiFilters);
  };

  const clearFilters = () => {
    setFilters({});
    setLocalStatusFilter("");
    setSearchTerm("");
    setVencimentoDiaExato(false);
    setEmissaoDiaExato(false);
    fetchBoletos();
  };

  // Parsear data de vencimento corretamente (movido para antes do uso em filteredBoletos)
  const parseDueDate = (dueDate: string): Date => {
    let vencimento: Date;

    if (!dueDate || !String(dueDate).trim()) {
      vencimento = new Date(1970, 0, 1);
      vencimento.setHours(0, 0, 0, 0);
      return vencimento;
    }

    // Extrair apenas a parte da data (antes do T se existir)
    const datePart = dueDate.includes("T") ? dueDate.split("T")[0] : dueDate;

    if (datePart.includes("-")) {
      // Formato ISO: 2020-12-06 ou 0020-12-06
      const [year, month, day] = datePart.split("-").map(Number);
      // Corrigir anos com 2 dígitos ou anos muito pequenos (< 100)
      const correctedYear = year < 100 ? year + 2000 : year;
      vencimento = new Date(correctedYear, month - 1, day);
    } else if (datePart.includes("/")) {
      // Formato brasileiro: 06/12/2020 ou 06/12/20
      const parts = datePart.split("/").map(Number);
      // Corrigir anos com 2 dígitos
      const correctedYear = parts[2] < 100 ? parts[2] + 2000 : parts[2];
      vencimento = new Date(correctedYear, parts[1] - 1, parts[0]);
    } else {
      vencimento = new Date(dueDate);
      // Verificar se o ano é muito pequeno e corrigir
      if (vencimento.getFullYear() < 100) {
        vencimento.setFullYear(vencimento.getFullYear() + 2000);
      }
    }

    vencimento.setHours(0, 0, 0, 0);
    return vencimento;
  };

  /** YYYY-MM-DD alinhado ao calendário local (evita erro de fuso com `new Date(iso)`). */
  const toYmdFromParts = (d: Date): string =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;

  const getVencimentoYmd = (boleto: Boleto): string =>
    toYmdFromParts(parseDueDate(boleto.dueDate));

  /** Data de emissão do banco (issueDate); fallback dataCadastro do CRM. */
  const getEmissaoYmd = (boleto: Boleto): string | null => {
    const raw = boleto.issueDate || boleto.dataCadastro;
    if (!raw || !String(raw).trim()) return null;
    try {
      return toYmdFromParts(parseDueDate(raw));
    } catch {
      return null;
    }
  };

  // Verificar se boleto está vencido (movido para antes do uso em filteredBoletos)
  const isVencido = (boleto: Boleto): boolean => {
    // Se o boleto já foi pago ou cancelado, não está vencido
    if (verificarSeFoiPago(boleto) || boleto.status === "CANCELADO") {
      return false;
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencimento = parseDueDate(boleto.dueDate);
    return vencimento < hoje;
  };

  const boletoConsideradoVencido = (boleto: Boleto): boolean => {
    if (typeof boleto.estaVencido === "boolean") return boleto.estaVencido;
    if (normalizarStatusBoleto(boleto.status) === "VENCIDO") return true;
    return isVencido(boleto);
  };

  const filteredBoletos = boletos.filter((boleto) => {
    // Filtro local de status especial (PAGO, EXPIRADO)
    if (localStatusFilter === "PAGO" && !verificarSeFoiPago(boleto)) {
      return false;
    }
    if (localStatusFilter === "EXPIRADO") {
      if (boleto.status !== "BAIXADO" || verificarSeFoiPago(boleto)) {
        return false;
      }
    }

    // Filtro de status do dropdown (aplicado localmente para resposta imediata)
    if (filters.status) {
      if (filters.status === "VENCIDO") {
        if (!boletoConsideradoVencido(boleto)) {
          return false;
        }
      }
      // PENDENTE = todos os boletos que não foram pagos ainda (exceto cancelados)
      else if (filters.status === "PENDENTE") {
        if (verificarSeFoiPago(boleto) || boleto.status === "CANCELADO") {
          return false;
        }
      }
      // BAIXADO = boletos com status BAIXADO que NÃO foram pagos
      else if (filters.status === "BAIXADO") {
        if (boleto.status !== "BAIXADO" || verificarSeFoiPago(boleto)) {
          return false;
        }
      } else if (boleto.status !== filters.status) {
        return false;
      }
    }

    // Filtro de data de vencimento (usa parseDueDate — mesma base que "vencido" e exportações)
    if (filters.dataInicio) {
      const boletoLocalDateStr = getVencimentoYmd(boleto);

      if (vencimentoDiaExato) {
        if (boletoLocalDateStr !== filters.dataInicio) {
          return false;
        }
      } else {
        if (boletoLocalDateStr < filters.dataInicio) {
          return false;
        }
      }
    }

    if (filters.dataFim && !vencimentoDiaExato) {
      const boletoLocalDateStr = getVencimentoYmd(boleto);
      if (boletoLocalDateStr > filters.dataFim) {
        return false;
      }
    }

    // Filtro de data de emissão (issueDate do banco; fallback dataCadastro)
    const temFiltroEmissao = !!(
      filters.dataEmissaoInicio || filters.dataEmissaoFim
    );
    const emissaoYmd = getEmissaoYmd(boleto);
    if (temFiltroEmissao && !emissaoYmd) {
      return false;
    }

    if (filters.dataEmissaoInicio && emissaoYmd) {
      if (emissaoDiaExato) {
        if (emissaoYmd !== filters.dataEmissaoInicio) {
          return false;
        }
      } else {
        if (emissaoYmd < filters.dataEmissaoInicio) {
          return false;
        }
      }
    }

    if (filters.dataEmissaoFim && !emissaoDiaExato && emissaoYmd) {
      if (emissaoYmd > filters.dataEmissaoFim) {
        return false;
      }
    }

    // Filtro de busca por texto
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      boleto.id.toString().includes(searchLower) ||
      (boleto.nsuCode?.toLowerCase() || "").includes(searchLower) ||
      (boleto.payerName?.toLowerCase() || "").includes(searchLower) ||
      (boleto.contrato?.clienteNome?.toLowerCase() || "").includes(
        searchLower,
      ) ||
      (boleto.contrato?.numeroContrato?.toLowerCase() || "").includes(
        searchLower,
      )
    );
  });

  // Ordenação
  const sortedBoletos = [...filteredBoletos].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "name":
        // Ordenar por nome do cliente (alfabético)
        const nomeA = (
          a.contrato?.clienteNome ||
          a.payerName ||
          ""
        ).toLowerCase();
        const nomeB = (
          b.contrato?.clienteNome ||
          b.payerName ||
          ""
        ).toLowerCase();
        comparison = nomeA.localeCompare(nomeB, "pt-BR");
        break;
      case "date":
        comparison =
          new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        break;
      case "value":
        comparison = a.nominalValue - b.nominalValue;
        break;
      case "status":
        comparison = a.status.localeCompare(b.status);
        break;
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });

  const totalPages = Math.ceil(sortedBoletos.length / ITEMS_PER_PAGE);
  const paginatedBoletos = sortedBoletos.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    filters,
    localStatusFilter,
    sortBy,
    sortOrder,
    vencimentoDiaExato,
    emissaoDiaExato,
  ]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  // Calcular dias de atraso para boletos vencidos
  const calcularDiasAtraso = (dueDate: string): number | null => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencimento = parseDueDate(dueDate);

    if (vencimento < hoje) {
      const diffTime = hoje.getTime() - vencimento.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return null;
  };

  // Formatar tempo de atraso (anos + dias quando > 365 dias)
  const formatarTempoAtraso = (dias: number): string => {
    if (dias >= 365) {
      const anos = Math.floor(dias / 365);
      const diasRestantes = dias % 365;

      if (diasRestantes === 0) {
        return `${anos} ano${anos > 1 ? "s" : ""}`;
      }
      return `${anos} ano${anos > 1 ? "s" : ""} e ${diasRestantes} dia${
        diasRestantes > 1 ? "s" : ""
      }`;
    }
    return `${dias} dia${dias > 1 ? "s" : ""}`;
  };

  const StatusIcon = ({ status }: { status: BoletoStatus }) => {
    switch (status) {
      case "PENDENTE":
        return <Clock className="w-4 h-4" />;
      case "REGISTRADO":
        return <FileText className="w-4 h-4" />;
      case "LIQUIDADO":
        return <CheckCircle className="w-4 h-4" />;
      case "BAIXADO":
        return <CheckCircle className="w-4 h-4" />;
      case "VENCIDO":
        return <AlertTriangle className="w-4 h-4" />;
      case "CANCELADO":
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  if (loading && boletos.length === 0) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="relative">
              <RefreshCw className="w-12 h-12 animate-spin text-amber-400 mx-auto" />
              <div className="absolute inset-0 blur-xl bg-amber-500/30 animate-pulse" />
            </div>
            <p className="mt-4 text-neutral-400 font-medium">
              Carregando boletos...
            </p>
          </motion.div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg shadow-amber-500/30">
                  <Receipt className="w-8 h-8 text-neutral-950" />
                </div>
                <h1 className="text-4xl font-bold text-gradient-amber">
                  Boletos
                </h1>
                <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
              </div>
              <p className="text-neutral-400 ml-14">
                Gerencie todos os boletos bancários do sistema
              </p>
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fetchBoletos()}
                className="group flex items-center gap-2 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <RefreshCw
                  className={`w-5 h-5 text-neutral-300 group-hover:text-amber-400 transition-colors ${
                    loading ? "animate-spin" : ""
                  }`}
                />
                <span className="font-medium text-neutral-200 group-hover:text-neutral-50">
                  Atualizar
                </span>
              </motion.button>

              {/* Botão de Exportar */}
              <div className="relative" data-export-menu>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  disabled={exporting || sortedBoletos.length === 0}
                  className="group flex items-center gap-2 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileDown
                    className={`w-5 h-5 text-neutral-300 group-hover:text-blue-400 transition-colors ${
                      exporting ? "animate-pulse" : ""
                    }`}
                  />
                  <span className="font-medium text-neutral-200 group-hover:text-neutral-50">
                    {exporting ? "Exportando..." : "Exportar"}
                  </span>
                  <ChevronDown className="w-4 h-4 text-neutral-400" />
                </motion.button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {showExportMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-neutral-800 border border-neutral-700 rounded-xl shadow-xl z-50 overflow-hidden"
                    >
                      <button
                        onClick={exportToExcel}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-neutral-200 hover:bg-neutral-700 transition-colors"
                      >
                        <FileSpreadsheet className="w-5 h-5 text-green-400" />
                        <span>Excel (CSV)</span>
                      </button>
                      <button
                        onClick={exportToPDF}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-neutral-200 hover:bg-neutral-700 transition-colors"
                      >
                        <FileText className="w-5 h-5 text-red-400" />
                        <span>PDF</span>
                      </button>
                      <button
                        onClick={exportToWord}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-neutral-200 hover:bg-neutral-700 transition-colors"
                      >
                        <FileText className="w-5 h-5 text-blue-400" />
                        <span>Word (DOC)</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <SincronizarTodosButton
                onSincronizacaoConcluida={() => fetchBoletos()}
              />

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowGerarLoteModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-300"
              >
                <Layers className="w-5 h-5" />
                Gerar em Lote
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNewBoletoModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-neutral-950 rounded-xl font-medium shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all duration-300"
              >
                <Plus className="w-5 h-5" />
                Novo Boleto
              </motion.button>
            </div>
          </motion.div>

          {/* Estatísticas Rápidas - Estilo Premium Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
            {[
              {
                label: "Total",
                value:
                  listagemResumo !== null
                    ? listagemResumo.total.toLocaleString("pt-BR")
                    : "—",
                icon: FileText,
                colSpan: 1,
                isCurrency: false,
              },
              {
                label: "Valor Total",
                value:
                  listagemResumo !== null
                    ? formatCurrency(listagemResumo.valorTotal)
                    : "—",
                icon: DollarSign,
                colSpan: 2,
                isCurrency: true,
              },
              {
                label: "Total Pago",
                value:
                  listagemResumo !== null
                    ? formatCurrency(listagemResumo.totalPago)
                    : "—",
                icon: CheckCircle,
                colSpan: 2,
                isCurrency: true,
              },
              {
                label: "Pendentes",
                value:
                  listagemResumo !== null
                    ? listagemResumo.pendentes.toLocaleString("pt-BR")
                    : "—",
                icon: Clock,
                colSpan: 1,
                isCurrency: false,
              },
              {
                label: "Pagos",
                value:
                  listagemResumo !== null
                    ? listagemResumo.pagos.toLocaleString("pt-BR")
                    : "—",
                icon: CheckCircle,
                colSpan: 1,
                isCurrency: false,
              },
              {
                label: "Vencidos",
                value:
                  listagemResumo !== null
                    ? listagemResumo.vencidos.toLocaleString("pt-BR")
                    : "—",
                icon: AlertTriangle,
                colSpan: 1,
                isCurrency: false,
              },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "bg-neutral-900/95 backdrop-blur-xl p-6 rounded-xl border border-neutral-800 hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/10 transition-all",
                  stat.colSpan === 2 &&
                    "col-span-2 md:col-span-2 lg:col-span-2",
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/30">
                    <stat.icon className="w-6 h-6 text-amber-400" />
                  </div>
                </div>
                <p className="text-neutral-400 text-sm mb-1">{stat.label}</p>
                <p
                  className={cn(
                    "font-bold text-neutral-50 whitespace-nowrap",
                    stat.isCurrency ? "text-xl lg:text-2xl" : "text-3xl",
                  )}
                >
                  {stat.value}
                </p>
              </motion.div>
            ))}
          </div>
          <div className="text-neutral-500 text-xs mb-8 max-w-2xl leading-relaxed rounded-lg border border-neutral-800/80 bg-neutral-900/40 px-3 py-2.5">
            <p className="font-medium text-neutral-400 mb-1">
              Sobre os totais acima
            </p>
            <p>
              Os valores vêm do{" "}
              <strong className="text-neutral-300">
                resumo calculado no backend
              </strong>{" "}
              na última consulta à API. A lista pode ter filtros locais (busca,
              etc.) sem alterar esse resumo. Em{" "}
              <span className="text-amber-400/90 font-medium">
                Gestão → Comissões
              </span>
              , contabilizamos apenas contratos{" "}
              <strong className="text-neutral-300">
                assinados ou quitados
              </strong>{" "}
              que já geram comissão.
            </p>
          </div>

          {/* Barra de Busca e Filtros */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-neutral-900/95 backdrop-blur-xl rounded-2xl border border-neutral-800 shadow-xl p-6 mb-8"
          >
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Busca */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-500 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar por ID, NSU, cliente ou contrato..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 text-neutral-100 placeholder-neutral-500"
                />
              </div>

              {/* Controles */}
              <div className="flex items-center gap-3">
                {/* Ordenação */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                    }
                    className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
                  >
                    <ArrowUpDown className="w-5 h-5 text-neutral-400" />
                  </button>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-2 bg-neutral-800/50 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-neutral-200"
                  >
                    <option value="name">Nome</option>
                    <option value="date">Data</option>
                    <option value="value">Valor</option>
                    <option value="status">Status</option>
                  </select>
                </div>

                {/* View Mode */}
                <div className="flex items-center bg-neutral-800 rounded-lg p-1 border border-neutral-700">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded ${
                      viewMode === "grid"
                        ? "bg-amber-500 shadow-lg shadow-amber-500/20"
                        : ""
                    } transition-all duration-200`}
                  >
                    <svg
                      className={`w-5 h-5 ${
                        viewMode === "grid"
                          ? "text-neutral-950"
                          : "text-neutral-400"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded ${
                      viewMode === "list"
                        ? "bg-amber-500 shadow-lg shadow-amber-500/20"
                        : ""
                    } transition-all duration-200`}
                  >
                    <svg
                      className={`w-5 h-5 ${
                        viewMode === "list"
                          ? "text-neutral-950"
                          : "text-neutral-400"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <line x1="3" y1="12" x2="21" y2="12" />
                      <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                  </button>
                </div>

                {/* Filtros */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors"
                >
                  <Filter className="w-5 h-5 text-neutral-400" />
                  <span className="font-medium text-neutral-200">Filtros</span>
                  <ChevronDown
                    className={`w-4 h-4 text-neutral-400 transition-transform ${
                      showFilters ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Painel de Filtros */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6 pt-6 border-t border-neutral-700">
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Status
                      </label>
                      <select
                        value={
                          localStatusFilter !== ""
                            ? localStatusFilter
                            : filters.status || ""
                        }
                        onChange={(e) => {
                          const value = e.target.value;
                          // PAGO e EXPIRADO são filtros locais
                          if (value === "PAGO" || value === "EXPIRADO") {
                            setLocalStatusFilter(value);
                            handleFilterChange("status", undefined);
                          } else {
                            setLocalStatusFilter("");
                            handleFilterChange("status", value || undefined);
                          }
                        }}
                        className="w-full px-3 py-2 bg-neutral-800/50 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-neutral-100"
                      >
                        <option value="">Todos</option>
                        <option value="PENDENTE">Pendentes (Não Pagos)</option>
                        <option value="PAGO">Pagos</option>
                        <option value="ATIVO">Ativo</option>
                        <option value="REGISTRADO">Registrado</option>
                        <option value="LIQUIDADO">Liquidado</option>
                        <option value="VENCIDO">Vencido</option>
                        <option value="BAIXADO">Baixado (não pago)</option>
                        <option value="EXPIRADO">
                          Baixado / expirado (não pago)
                        </option>
                        <option value="CANCELADO">Cancelado</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Vencimento {vencimentoDiaExato ? "(Dia)" : "(De)"}
                      </label>
                      <input
                        type="date"
                        value={filters.dataInicio || ""}
                        onChange={(e) =>
                          handleFilterChange("dataInicio", e.target.value)
                        }
                        className="w-full px-3 py-2 bg-neutral-800/50 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <label className="flex items-center gap-2 mt-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={vencimentoDiaExato}
                          onChange={(e) => {
                            setVencimentoDiaExato(e.target.checked);
                            if (e.target.checked) {
                              handleFilterChange("dataFim", undefined);
                            }
                          }}
                          className="w-4 h-4 rounded border-neutral-600 bg-neutral-700 text-green-500 focus:ring-green-500 focus:ring-offset-neutral-800"
                        />
                        <span className="text-xs text-neutral-400">
                          Dia exato
                        </span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Vencimento (Até)
                      </label>
                      <input
                        type="date"
                        value={filters.dataFim || ""}
                        onChange={(e) =>
                          handleFilterChange("dataFim", e.target.value)
                        }
                        disabled={vencimentoDiaExato}
                        className={`w-full px-3 py-2 bg-neutral-800/50 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${vencimentoDiaExato ? "opacity-50 cursor-not-allowed" : ""}`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Emissão {emissaoDiaExato ? "(Dia)" : "(De)"}
                      </label>
                      <input
                        type="date"
                        value={filters.dataEmissaoInicio || ""}
                        onChange={(e) =>
                          handleFilterChange(
                            "dataEmissaoInicio",
                            e.target.value,
                          )
                        }
                        className="w-full px-3 py-2 bg-neutral-800/50 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <label className="flex items-center gap-2 mt-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={emissaoDiaExato}
                          onChange={(e) => {
                            setEmissaoDiaExato(e.target.checked);
                            if (e.target.checked) {
                              handleFilterChange("dataEmissaoFim", undefined);
                            }
                          }}
                          className="w-4 h-4 rounded border-neutral-600 bg-neutral-700 text-amber-500 focus:ring-amber-500 focus:ring-offset-neutral-800"
                        />
                        <span className="text-xs text-neutral-400">
                          Dia exato
                        </span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Emissão (Até)
                      </label>
                      <input
                        type="date"
                        value={filters.dataEmissaoFim || ""}
                        onChange={(e) =>
                          handleFilterChange("dataEmissaoFim", e.target.value)
                        }
                        disabled={emissaoDiaExato}
                        className={`w-full px-3 py-2 bg-neutral-800/50 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${emissaoDiaExato ? "opacity-50 cursor-not-allowed" : ""}`}
                      />
                    </div>

                    <div className="flex items-end gap-2">
                      <button
                        onClick={applyFilters}
                        className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300 whitespace-nowrap"
                      >
                        Aplicar
                      </button>
                      <button
                        onClick={clearFilters}
                        className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg font-medium transition-colors"
                      >
                        Limpar
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Lista de Boletos */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {paginatedBoletos.map((boleto, index) => (
                  <motion.div
                    key={boleto.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.02 }}
                    className="relative group h-full"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 opacity-0 group-hover:opacity-10 blur-2xl transition-opacity duration-500 rounded-2xl" />
                    <div className="bg-neutral-900/95 backdrop-blur-sm rounded-2xl border border-neutral-800 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden h-full flex flex-col">
                      {/* Header do Card */}
                      <div className="p-5 border-b border-neutral-800">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-sm text-neutral-500 mb-1">
                              Boleto #{boleto.id}
                            </p>
                            <h3 className="font-semibold text-neutral-50 text-lg">
                              {boleto.payerName}
                            </h3>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <StatusBadge
                              status={boleto.status}
                              foiPago={boleto.foiPago}
                              paidValue={boleto.paidValue}
                              statusDescription={boleto.statusDescription}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-neutral-400">
                          <Building className="w-4 h-4" />
                          <span>
                            {boleto.contrato?.clienteNome || "Sem contrato"}
                          </span>
                        </div>
                        {(boleto.contrato?.numeroPasta ||
                          boleto.contrato?.tipoServico) && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {boleto.contrato.numeroPasta && (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                                <FileText className="w-3 h-3" />
                                {boleto.contrato.numeroPasta}
                              </span>
                            )}
                            {boleto.contrato.tipoServico && (
                              <span className="inline-flex items-center text-xs font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md">
                                {boleto.contrato.tipoServico}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Corpo do Card */}
                      <div className="p-5 space-y-4 flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-neutral-500">Valor</p>
                            <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                              {formatCurrency(boleto.nominalValue)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-neutral-500">
                              Vencimento
                            </p>
                            <p className="text-lg font-semibold text-neutral-50">
                              {formatDate(boleto.dueDate)}
                            </p>
                            {boletoConsideradoVencido(boleto) &&
                              calcularDiasAtraso(boleto.dueDate) != null && (
                              <p className="text-xs font-bold text-red-400 mt-1">
                                Vencido há{" "}
                                {formatarTempoAtraso(
                                  calcularDiasAtraso(boleto.dueDate)!,
                                )}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Alerta de Vencimento */}
                        {boletoConsideradoVencido(boleto) &&
                          calcularDiasAtraso(boleto.dueDate) != null && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-red-400" />
                              <p className="text-sm font-semibold text-red-800">
                                Boleto vencido há{" "}
                                {formatarTempoAtraso(
                                  calcularDiasAtraso(boleto.dueDate)!,
                                )}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* NSU e Data de Criação */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-neutral-800/50 rounded-lg">
                            <p className="text-xs text-neutral-500 mb-1">NSU</p>
                            <p className="font-mono text-sm text-neutral-300">
                              {boleto.nsuCode || "N/A"}
                            </p>
                          </div>
                          <div className="p-3 bg-neutral-800/50 rounded-lg">
                            <p className="text-xs text-neutral-500 mb-1">
                              Criado em
                            </p>
                            <p className="text-sm text-neutral-300">
                              {boleto.dataCadastro
                                ? formatDate(boleto.dataCadastro)
                                : "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="p-4 bg-neutral-800/50 border-t border-neutral-800 mt-auto">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => handleViewDetails(boleto)}
                            className="flex-1 min-w-[100px] flex items-center justify-center gap-1.5 px-3 py-2 bg-neutral-800/50 hover:bg-amber-500/20 border border-neutral-700 hover:border-amber-500/30 text-amber-400 rounded-lg transition-colors font-medium text-sm"
                          >
                            <Eye className="w-4 h-4" />
                            Detalhes
                          </button>
                          {verificarSeFoiPago(boleto) && (
                            <div className="flex-1 min-w-[100px] flex items-center justify-center gap-1.5 px-3 py-2 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg font-medium text-sm">
                              <CheckCircle className="w-4 h-4" />
                              Quitado
                            </div>
                          )}
                          {!verificarSeFoiPago(boleto) &&
                            boleto.status !== "CANCELADO" && (
                              <>
                                <button
                                  onClick={() => handleSendEmail(boleto)}
                                  className="flex-1 min-w-[80px] flex items-center justify-center gap-1.5 px-3 py-2 bg-neutral-800/50 hover:bg-blue-500/20 border border-neutral-700 hover:border-blue-500/30 text-blue-400 rounded-lg transition-colors font-medium text-sm"
                                  title="Enviar boleto por email"
                                >
                                  <Mail className="w-4 h-4" />
                                  Email
                                </button>
                                <button
                                  onClick={() => handleDownloadPdf(boleto)}
                                  disabled={downloadingPdfId === boleto.id}
                                  className="flex-1 min-w-[100px] flex items-center justify-center gap-1.5 px-3 py-2 bg-neutral-800/50 hover:bg-red-500/20 border border-neutral-700 hover:border-red-500/30 text-red-400 rounded-lg transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Baixar PDF oficial do Santander"
                                >
                                  {downloadingPdfId === boleto.id ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Download className="w-4 h-4" />
                                  )}
                                  {downloadingPdfId === boleto.id
                                    ? "Baixando..."
                                    : "PDF"}
                                </button>
                                <button
                                  onClick={() => handleSync(boleto)}
                                  disabled={syncingId === boleto.id}
                                  className="flex-1 min-w-[100px] flex items-center justify-center gap-1.5 px-3 py-2 bg-neutral-800/50 hover:bg-green-500/20 border border-neutral-700 hover:border-green-500/30 text-green-400 rounded-lg transition-colors font-medium text-sm disabled:opacity-50"
                                >
                                  <RefreshCw
                                    className={`w-4 h-4 ${
                                      syncingId === boleto.id
                                        ? "animate-spin"
                                        : ""
                                    }`}
                                  />
                                  Sync
                                </button>
                              </>
                            )}
                          {!verificarSeFoiPago(boleto) &&
                            boleto.status !== "CANCELADO" && (
                              <button
                                onClick={() => handleDelete(boleto)}
                                disabled={deletingId === boleto.id}
                                className="p-2 bg-neutral-800/50 hover:bg-red-500/20 border border-neutral-700 hover:border-red-500/30 text-red-400 rounded-lg transition-colors disabled:opacity-50"
                                title="Cancelar boleto"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            /* View de Lista */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-neutral-900/95 backdrop-blur-xl rounded-2xl border border-neutral-800 shadow-xl overflow-hidden relative"
            >
              {/* Loading overlay */}
              <AnimatePresence>
                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 z-10 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw className="w-8 h-8 animate-spin text-amber-400" />
                      <span className="text-sm text-neutral-300">
                        Carregando...
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-neutral-800/50 border-b border-neutral-700 sticky top-0 z-[5]">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                        ID / NSU
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                        Cliente / Contrato
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                        Valor
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                        Criação
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                        Vencimento
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                        DataPagamento
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {paginatedBoletos.map((boleto) => (
                      <tr
                        key={boleto.id}
                        className="hover:bg-neutral-800/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-neutral-50">
                              #{boleto.id}
                            </p>
                            {boleto.nsuCode && (
                              <p className="text-xs text-neutral-500 font-mono">
                                {boleto.nsuCode}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-neutral-50">
                              {boleto.payerName}
                            </p>
                            <p className="text-sm text-neutral-500">
                              {boleto.contrato?.clienteNome || "Sem contrato"}
                            </p>
                            {(boleto.contrato?.numeroPasta ||
                              boleto.contrato?.tipoServico) && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {boleto.contrato.numeroPasta && (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                                    <FileText className="w-3 h-3" />
                                    {boleto.contrato.numeroPasta}
                                  </span>
                                )}
                                {boleto.contrato.tipoServico && (
                                  <span className="inline-flex items-center text-xs font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded">
                                    {boleto.contrato.tipoServico}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <StatusBadge
                              status={boleto.status}
                              foiPago={boleto.foiPago}
                              paidValue={boleto.paidValue}
                              statusDescription={boleto.statusDescription}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-neutral-50">
                            {formatCurrency(boleto.nominalValue)}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-neutral-400 text-sm">
                            {boleto.dataCadastro
                              ? formatDate(boleto.dataCadastro)
                              : "-"}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-neutral-300">
                              {formatDate(boleto.dueDate)}
                            </p>
                            {boletoConsideradoVencido(boleto) &&
                              calcularDiasAtraso(boleto.dueDate) != null && (
                              <p className="text-xs font-bold text-red-400 mt-1">
                                ⚠️ Vencido há{" "}
                                {formatarTempoAtraso(
                                  calcularDiasAtraso(boleto.dueDate)!,
                                )}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-neutral-300">
                              {boleto.dataPagamento
                                ? formatDate(boleto.dataPagamento)
                                : "-"}
                            </p>
                            {boleto.dataPagamento && (
                              <p className="text-xs text-green-400 mt-1">
                                ✓ Pago
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Paginação */}
          {sortedBoletos.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 bg-neutral-800/50/30 border-t border-neutral-700/50">
              <div className="text-sm text-neutral-400">
                Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                {Math.min(currentPage * ITEMS_PER_PAGE, sortedBoletos.length)}{" "}
                de {sortedBoletos.length} registros
              </div>
              <div className="flex items-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-2 text-sm font-medium text-neutral-300 bg-neutral-800 border border-neutral-700 rounded-lg hover:bg-neutral-700 hover:border-amber-500/50 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-neutral-800 disabled:hover:border-neutral-700"
                >
                  <ChevronLeft className="w-4 h-4" />
                </motion.button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    if (totalPages <= 7) return true;
                    if (page === 1 || page === totalPages) return true;
                    if (Math.abs(page - currentPage) <= 1) return true;
                    if (page === currentPage - 2 || page === currentPage + 2)
                      return true;
                    return false;
                  })
                  .reduce<(number | "ellipsis")[]>((acc, page, idx, arr) => {
                    if (idx > 0 && page - (arr[idx - 1] as number) > 1) {
                      acc.push("ellipsis");
                    }
                    acc.push(page);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === "ellipsis" ? (
                      <span
                        key={`ellipsis-${idx}`}
                        className="px-2 text-neutral-500 text-xs"
                      >
                        ...
                      </span>
                    ) : (
                      <motion.button
                        key={item}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setCurrentPage(item)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                          currentPage === item
                            ? "text-white bg-amber-500 border border-transparent hover:bg-amber-600"
                            : "text-neutral-300 bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 hover:border-amber-500/50"
                        }`}
                      >
                        {item}
                      </motion.button>
                    ),
                  )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  className="px-3 py-2 text-sm font-medium text-neutral-300 bg-neutral-800 border border-neutral-700 rounded-lg hover:bg-neutral-700 hover:border-amber-500/50 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-neutral-800 disabled:hover:border-neutral-700"
                >
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {sortedBoletos.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <div className="relative inline-block">
                <Receipt className="w-24 h-24 text-neutral-300 mx-auto mb-6" />
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute inset-0 bg-green-400/20 blur-3xl rounded-full"
                />
              </div>
              <p className="text-2xl font-bold text-neutral-300 mb-2">
                {searchTerm ||
                Object.keys(filters).length > 0 ||
                localStatusFilter
                  ? "Nenhum boleto encontrado"
                  : "Nenhum boleto cadastrado"}
              </p>
              <p className="text-neutral-500 max-w-md mx-auto mb-6">
                {searchTerm ||
                Object.keys(filters).length > 0 ||
                localStatusFilter
                  ? "Tente ajustar os filtros ou termos de busca"
                  : "Comece criando seu primeiro boleto bancário"}
              </p>
              {(searchTerm ||
                Object.keys(filters).length > 0 ||
                localStatusFilter) && (
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl font-medium transition-colors"
                >
                  Limpar Filtros
                </button>
              )}
            </motion.div>
          )}

          {/* Modal de Detalhes legacy - REMOVIDO (usar apenas BoletoDetailsModal) */}

          {/* Erro */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-xl p-4 shadow-lg max-w-md z-40"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-800 font-medium">
                    Erro ao carregar boletos
                  </p>
                  <p className="text-red-400 text-sm mt-1">{error}</p>
                </div>
                <button
                  onClick={clearError}
                  className="text-red-400 hover:text-red-800 hover:bg-red-100 p-1 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Toast de Download em Progresso */}
          <AnimatePresence>
            {downloadingPdfId && (
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.3 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                className="fixed bottom-8 right-8 z-50"
              >
                <div className="bg-neutral-900/95 backdrop-blur-xl border border-neutral-800 text-neutral-100 rounded-2xl shadow-2xl p-6 min-w-[320px]">
                  <div className="flex items-center gap-4">
                    {/* Ícone Animado */}
                    <div className="relative">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="w-12 h-12 rounded-full border-4 border-amber-500/30 border-t-amber-500 flex items-center justify-center"
                      >
                        <Download className="w-6 h-6 text-amber-400" />
                      </motion.div>
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.5, 0.8, 0.5],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="absolute inset-0 bg-amber-500/20 rounded-full blur-md"
                      />
                    </div>

                    {/* Texto */}
                    <div className="flex-1">
                      <p className="font-bold text-lg mb-1 text-neutral-100">
                        Baixando PDF...
                      </p>
                      <p className="text-neutral-300 text-sm">
                        Boleto #{downloadingPdfId}
                      </p>
                      <p className="text-neutral-400 text-xs mt-1 truncate max-w-[200px]">
                        {downloadingPdfName}
                      </p>
                    </div>

                    {/* Animação de Progresso */}
                    <motion.div
                      className="absolute bottom-0 left-0 h-1 bg-amber-500/40 rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 3, ease: "easeInOut" }}
                    />
                  </div>

                  {/* Barra de progresso indeterminada */}
                  <div className="mt-3 w-full bg-neutral-800/50 rounded-full h-1 overflow-hidden">
                    <motion.div
                      className="h-full bg-neutral-900/95 backdrop-blur-xl rounded-full"
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      style={{ width: "50%" }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Modal de Detalhes com Status da API */}
          {selectedBoleto && (
            <BoletoDetailsModal
              boletoId={selectedBoleto.id}
              isOpen={showDetailsModal}
              onClose={closeDetailsModal}
            />
          )}

          {/* Modal Novo Boleto */}
          <NovoBoletoModal
            isOpen={showNewBoletoModal}
            onClose={() => setShowNewBoletoModal(false)}
            onSuccess={() => {
              fetchBoletos();
              setShowNewBoletoModal(false);
            }}
          />

          {/* Modal Gerar Boletos em Lote */}
          <GerarBoletosLoteModal
            isOpen={showGerarLoteModal}
            onClose={() => setShowGerarLoteModal(false)}
            onSuccess={() => {
              fetchBoletos();
            }}
          />

          {/* Modal Enviar Email */}
          <EnviarEmailModal
            boleto={boletoParaEmail}
            isOpen={showEnviarEmailModal}
            onClose={closeEnviarEmailModal}
            onSuccess={() => {
              // Opcional: recarregar boletos ou mostrar feedback adicional
            }}
          />
        </div>
      </div>
    </MainLayout>
  );
}
