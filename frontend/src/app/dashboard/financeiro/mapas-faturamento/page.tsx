"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import MainLayout from "@/components/MainLayout";
import { useBoletos } from "@/hooks/useBoletos";
import { Boleto } from "@/types/boleto";
import {
  Building2,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Download,
  Search,
  Eye,
  X,
  RefreshCw,
  MapPin,
  ChevronDown,
  Filter,
  TrendingUp,
  TrendingDown,
  Banknote,
  Receipt,
  Users,
  ArrowUpDown,
  BarChart3,
  Tag,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type TipoBoletoManualStr = "AVULSO" | "RENEGOCIACAO" | "ANTECIPACAO" | null;

interface FaturaDetalhada {
  id: number;
  boletoId: number;
  clienteNome: string;
  clienteDocumento: string;
  numeroContrato: string;
  filialNome: string;
  tipoBoletoManual: TipoBoletoManualStr;
  valor: number;
  dataVencimento: string;
  status: "PENDENTE" | "VENCIDO" | "LIQUIDADO" | "REGISTRADO" | "CANCELADO";
  diasAtraso: number;
  boleto: Boleto;
}

interface EmpresaAgrupada {
  id: string;
  nome: string;
  documento: string;
  faturas: FaturaDetalhada[];
  valorTotal: number;
  valorPendente: number;
  valorLiquidado: number;
  valorVencido: number;
  totalBoletos: number;
  boletosLiquidados: number;
  boletosVencidos: number;
  boletosPendentes: number;
}

type OrdenacaoTipo = "nome" | "valor" | "boletos" | "vencidos";
type FiltroStatus = "todos" | "pendente" | "vencido" | "liquidado";

export default function MapasFaturamentoPage() {
  const { boletos, loading, fetchBoletos } = useBoletos();
  const [empresasExpandidas, setEmpresasExpandidas] = useState<Set<string>>(
    new Set()
  );
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todos");
  const [filtroFilial, setFiltroFilial] = useState("todas");
  const [ordenacao, setOrdenacao] = useState<OrdenacaoTipo>("nome");
  const [ordemAscendente, setOrdemAscendente] = useState(true);
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);
  const [boletoSelecionado, setBoletoSelecionado] = useState<Boleto | null>(
    null
  );
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportButtonRef = useRef<HTMLButtonElement>(null);
  const [exportMenuPosition, setExportMenuPosition] = useState({ top: 0, right: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchBoletos();
    const interval = setInterval(fetchBoletos, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fechar menu de exportação ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Verificar se o clique foi no container do menu ou no dropdown do portal
      if (
        !target.closest(".export-menu-container") &&
        !target.closest(".export-dropdown-portal")
      ) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      // Usar setTimeout para evitar que o clique de abertura feche o menu
      setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 100);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showExportMenu]);

  // Processar e agrupar faturas por empresa
  const empresasAgrupadas = useMemo(() => {
    const faturas: FaturaDetalhada[] = boletos.map((boleto) => {
      const hoje = new Date();
      const vencimento = new Date(boleto.dueDate);
      const diasAtraso = Math.max(
        0,
        Math.floor(
          (hoje.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24)
        )
      );

      // REGRA PRINCIPAL: Usar foiPago como fonte da verdade
      const foiPago = boleto.foiPago === true ||
        (boleto.foiPago === undefined && boleto.status === "LIQUIDADO");

      let status: FaturaDetalhada["status"] = "PENDENTE";
      if (foiPago) {
        status = "LIQUIDADO";
      } else if (boleto.status === "BAIXADO") {
        // BAIXADO sem foiPago = Expirado após 30 dias sem pagamento
        status = "VENCIDO";
      } else if (boleto.status === "CANCELADO") {
        status = "CANCELADO";
      } else if (diasAtraso > 0) {
        status = "VENCIDO";
      } else if (boleto.status === "REGISTRADO" || boleto.status === "ATIVO") {
        status = "REGISTRADO";
      }

      return {
        id: boleto.id,
        boletoId: boleto.id,
        clienteNome:
          boleto.contrato?.clienteNome || boleto.payerName || "Sem nome",
        clienteDocumento:
          boleto.contrato?.clienteDocumento || boleto.payerDocumentNumber || "",
        numeroContrato: boleto.contrato?.numeroContrato || "",
        filialNome: boleto.contrato?.filialNome || "",
        tipoBoletoManual: (boleto.tipoBoletoManual ?? null) as TipoBoletoManualStr,
        valor: boleto.nominalValue,
        dataVencimento: boleto.dueDate,
        status,
        diasAtraso,
        boleto,
      };
    });

    // Agrupar por empresa usando documento como chave principal
    const grupos: Record<string, EmpresaAgrupada> = {};

    faturas.forEach((fatura) => {
      const chave = fatura.clienteDocumento || fatura.clienteNome;

      if (!grupos[chave]) {
        grupos[chave] = {
          id: chave,
          nome: fatura.clienteNome,
          documento: fatura.clienteDocumento,
          faturas: [],
          valorTotal: 0,
          valorPendente: 0,
          valorLiquidado: 0,
          valorVencido: 0,
          totalBoletos: 0,
          boletosLiquidados: 0,
          boletosVencidos: 0,
          boletosPendentes: 0,
        };
      }

      const empresa = grupos[chave];
      empresa.faturas.push(fatura);
      empresa.valorTotal += fatura.valor;
      empresa.totalBoletos++;

      switch (fatura.status) {
        case "LIQUIDADO":
          empresa.valorLiquidado += fatura.valor;
          empresa.boletosLiquidados++;
          break;
        case "VENCIDO":
          empresa.valorVencido += fatura.valor;
          empresa.boletosVencidos++;
          break;
        case "PENDENTE":
        case "REGISTRADO":
          empresa.valorPendente += fatura.valor;
          empresa.boletosPendentes++;
          break;
      }
    });

    return Object.values(grupos);
  }, [boletos]);

  // Lista de filiais disponíveis
  const filiaisDisponiveis = useMemo(() => {
    const nomes = new Set<string>();
    empresasAgrupadas.forEach((empresa) =>
      empresa.faturas.forEach((f) => {
        if (f.filialNome) nomes.add(f.filialNome);
      })
    );
    return Array.from(nomes).sort();
  }, [empresasAgrupadas]);

  // Filtrar empresas
  const empresasFiltradas = useMemo(() => {
    let resultado = [...empresasAgrupadas];

    // Aplicar busca
    if (busca) {
      const termoBusca = busca.toLowerCase();
      resultado = resultado.filter(
        (empresa) =>
          empresa.nome.toLowerCase().includes(termoBusca) ||
          empresa.documento.includes(termoBusca) ||
          empresa.faturas.some((f) =>
            f.numeroContrato.toLowerCase().includes(termoBusca)
          )
      );
    }

    // Aplicar filtro de status
    if (filtroStatus !== "todos") {
      resultado = resultado.filter((empresa) => {
        switch (filtroStatus) {
          case "pendente":
            return empresa.boletosPendentes > 0;
          case "vencido":
            return empresa.boletosVencidos > 0;
          case "liquidado":
            return empresa.boletosLiquidados > 0;
          default:
            return true;
        }
      });
    }

    // Aplicar filtro de filial
    if (filtroFilial !== "todas") {
      resultado = resultado.filter((empresa) =>
        empresa.faturas.some((f) => f.filialNome === filtroFilial)
      );
    }

    // Aplicar ordenação
    resultado.sort((a, b) => {
      let comparacao = 0;

      switch (ordenacao) {
        case "nome":
          comparacao = a.nome.localeCompare(b.nome);
          break;
        case "valor":
          comparacao = a.valorTotal - b.valorTotal;
          break;
        case "boletos":
          comparacao = a.totalBoletos - b.totalBoletos;
          break;
        case "vencidos":
          comparacao = a.boletosVencidos - b.boletosVencidos;
          break;
      }

      return ordemAscendente ? comparacao : -comparacao;
    });

    return resultado;
  }, [empresasAgrupadas, busca, filtroStatus, filtroFilial, ordenacao, ordemAscendente]);

  const totalPages = Math.ceil(empresasFiltradas.length / ITEMS_PER_PAGE);
  const paginatedEmpresas = empresasFiltradas.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [busca, filtroStatus, filtroFilial, ordenacao, ordemAscendente]);

  // Estatísticas gerais
  const estatisticas = useMemo(() => {
    const stats = {
      totalEmpresas: empresasFiltradas.length,
      totalBoletos: 0,
      valorTotal: 0,
      valorLiquidado: 0,
      valorVencido: 0,
      valorPendente: 0,
      boletosLiquidados: 0,
      boletosVencidos: 0,
      boletosPendentes: 0,
    };

    empresasFiltradas.forEach((empresa) => {
      stats.totalBoletos += empresa.totalBoletos;
      stats.valorTotal += empresa.valorTotal;
      stats.valorLiquidado += empresa.valorLiquidado;
      stats.valorVencido += empresa.valorVencido;
      stats.valorPendente += empresa.valorPendente;
      stats.boletosLiquidados += empresa.boletosLiquidados;
      stats.boletosVencidos += empresa.boletosVencidos;
      stats.boletosPendentes += empresa.boletosPendentes;
    });

    return stats;
  }, [empresasFiltradas]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const formatDocument = (doc: string) => {
    if (!doc) return "";
    const cleaned = doc.replace(/\D/g, "");
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    if (cleaned.length === 14) {
      return cleaned.replace(
        /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
        "$1.$2.$3/$4-$5"
      );
    }
    return doc;
  };

  const toggleEmpresa = (empresaId: string) => {
    setEmpresasExpandidas((prev) => {
      const nova = new Set(prev);
      if (nova.has(empresaId)) {
        nova.delete(empresaId);
      } else {
        nova.add(empresaId);
      }
      return nova;
    });
  };

  const expandirTodas = () => {
    setEmpresasExpandidas(new Set(empresasFiltradas.map((e) => e.id)));
  };

  const recolherTodas = () => {
    setEmpresasExpandidas(new Set());
  };

  const handleVerDetalhes = (boleto: Boleto) => {
    setBoletoSelecionado(boleto);
    setMostrarDetalhes(true);
  };

  // Exportar para CSV
  const exportarCSV = () => {
    const headers = [
      "Empresa",
      "Documento",
      "Contrato",
      "Boleto ID",
      "Valor",
      "Vencimento",
      "Status",
      "Dias Atraso",
    ];

    const rows: string[][] = [];

    empresasFiltradas.forEach((empresa) => {
      empresa.faturas.forEach((fatura) => {
        rows.push([
          empresa.nome,
          empresa.documento,
          fatura.numeroContrato || "",
          fatura.boletoId.toString(),
          fatura.valor.toFixed(2).replace(".", ","),
          formatDate(fatura.dataVencimento),
          getStatusLabel(fatura.status),
          fatura.diasAtraso.toString(),
        ]);
      });
    });

    // Adicionar linha de resumo
    rows.push([]);
    rows.push(["RESUMO"]);
    rows.push(["Total de Empresas", estatisticas.totalEmpresas.toString()]);
    rows.push(["Total de Boletos", estatisticas.totalBoletos.toString()]);
    rows.push(["Valor Total", formatCurrency(estatisticas.valorTotal)]);
    rows.push(["Valor Liquidado", formatCurrency(estatisticas.valorLiquidado)]);
    rows.push(["Valor Vencido", formatCurrency(estatisticas.valorVencido)]);
    rows.push(["Valor Pendente", formatCurrency(estatisticas.valorPendente)]);

    const csvContent = [
      headers.join(";"),
      ...rows.map((row) => row.join(";")),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mapa-faturamento-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  // Exportar para Word (formato HTML que Word abre)
  const exportarWord = () => {
    const hoje = new Date().toLocaleDateString("pt-BR");

    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>Mapa de Faturamento</title>
        <style>
          body { font-family: Arial, sans-serif; }
          h1 { color: #d97706; }
          h2 { color: #374151; margin-top: 20px; }
          table { border-collapse: collapse; width: 100%; margin-top: 10px; }
          th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; font-size: 11px; }
          th { background-color: #f3f4f6; font-weight: bold; }
          .status-liquidado { color: #059669; }
          .status-vencido { color: #dc2626; }
          .status-pendente { color: #d97706; }
          .resumo { background-color: #fef3c7; padding: 15px; margin-top: 20px; }
          .resumo-item { margin: 5px 0; }
        </style>
      </head>
      <body>
        <h1>Mapa de Faturamento</h1>
        <p>Gerado em: ${hoje}</p>
        
        <div class="resumo">
          <h2>Resumo Geral</h2>
          <p class="resumo-item"><strong>Total de Empresas:</strong> ${estatisticas.totalEmpresas}</p>
          <p class="resumo-item"><strong>Total de Boletos:</strong> ${estatisticas.totalBoletos}</p>
          <p class="resumo-item"><strong>Valor Total:</strong> ${formatCurrency(estatisticas.valorTotal)}</p>
          <p class="resumo-item"><strong>Valor Liquidado:</strong> ${formatCurrency(estatisticas.valorLiquidado)} (${estatisticas.boletosLiquidados} boletos)</p>
          <p class="resumo-item"><strong>Valor Vencido:</strong> ${formatCurrency(estatisticas.valorVencido)} (${estatisticas.boletosVencidos} boletos)</p>
          <p class="resumo-item"><strong>Valor Pendente:</strong> ${formatCurrency(estatisticas.valorPendente)} (${estatisticas.boletosPendentes} boletos)</p>
        </div>
    `;

    empresasFiltradas.forEach((empresa) => {
      const taxaLiquidacao =
        empresa.totalBoletos > 0
          ? ((empresa.boletosLiquidados / empresa.totalBoletos) * 100).toFixed(1)
          : "0";

      html += `
        <h2>${empresa.nome}</h2>
        <p><strong>Documento:</strong> ${formatDocument(empresa.documento)}</p>
        <p><strong>Total de Boletos:</strong> ${empresa.totalBoletos} | <strong>Taxa de Liquidação:</strong> ${taxaLiquidacao}%</p>
        <p><strong>Valor Total:</strong> ${formatCurrency(empresa.valorTotal)} | 
           <strong>Liquidado:</strong> ${formatCurrency(empresa.valorLiquidado)} | 
           <strong>Vencido:</strong> ${formatCurrency(empresa.valorVencido)} | 
           <strong>Pendente:</strong> ${formatCurrency(empresa.valorPendente)}</p>
        
        <table>
          <thead>
            <tr>
              <th>Contrato</th>
              <th>Boleto</th>
              <th>Vencimento</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Dias Atraso</th>
            </tr>
          </thead>
          <tbody>
      `;

      empresa.faturas
        .sort(
          (a, b) =>
            new Date(a.dataVencimento).getTime() -
            new Date(b.dataVencimento).getTime()
        )
        .forEach((fatura) => {
          const statusClass =
            fatura.status === "LIQUIDADO"
              ? "status-liquidado"
              : fatura.status === "VENCIDO"
              ? "status-vencido"
              : "status-pendente";

          html += `
            <tr>
              <td>${fatura.numeroContrato || "Sem contrato"}</td>
              <td>#${fatura.boletoId}</td>
              <td>${formatDate(fatura.dataVencimento)}</td>
              <td>${formatCurrency(fatura.valor)}</td>
              <td class="${statusClass}">${getStatusLabel(fatura.status)}</td>
              <td>${fatura.diasAtraso > 0 ? fatura.diasAtraso + " dias" : "-"}</td>
            </tr>
          `;
        });

      html += `
          </tbody>
        </table>
      `;
    });

    html += `
      </body>
      </html>
    `;

    const blob = new Blob([html], {
      type: "application/msword;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mapa-faturamento-${new Date().toISOString().split("T")[0]}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "LIQUIDADO":
        return "bg-green-100 text-green-800 border-green-200";
      case "VENCIDO":
        return "bg-red-100 text-red-800 border-red-200";
      case "REGISTRADO":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "CANCELADO":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-amber-100 text-amber-800 border-amber-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "LIQUIDADO":
        return "Liquidado";
      case "VENCIDO":
        return "Vencido";
      case "REGISTRADO":
        return "Registrado";
      case "CANCELADO":
        return "Cancelado";
      case "PENDENTE":
        return "Pendente";
      default:
        return status;
    }
  };

  const getTipoBoletoConfig = (tipo: TipoBoletoManualStr) => {
    switch (tipo) {
      case "RENEGOCIACAO":
        return { label: "Renegociação", className: "text-purple-400 bg-purple-500/10 border-purple-500/20" };
      case "ANTECIPACAO":
        return { label: "Antecipação", className: "text-blue-400 bg-blue-500/10 border-blue-500/20" };
      case "AVULSO":
        return { label: "Avulso", className: "text-amber-400 bg-amber-500/10 border-amber-500/20" };
      default:
        return null;
    }
  };

  const isFirstLoad = loading && boletos.length === 0;

  if (isFirstLoad) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
          <div className="text-center">
            <RefreshCw className="w-12 h-12 animate-spin text-amber-500 mx-auto mb-4" />
            <p className="text-neutral-400">
              Carregando mapas de faturamento...
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
        {/* Header */}
        <div className="bg-neutral-900/50 backdrop-blur-xl border-b border-neutral-800">
          <div className="container mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg">
                  <MapPin className="w-8 h-8 text-neutral-950" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gradient-amber">
                    Mapas de Faturamento
                  </h1>
                  <p className="text-neutral-400 mt-1">
                    Análise detalhada de boletos por empresa
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => fetchBoletos()}
                  className="p-3 bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-colors"
                  title="Atualizar dados"
                  disabled={loading}
                >
                  <RefreshCw className={`w-5 h-5 text-neutral-300 ${loading ? "animate-spin" : ""}`} />
                </button>
                <div className="relative export-menu-container">
                  <button
                    ref={exportButtonRef}
                    onClick={() => {
                      if (exportButtonRef.current) {
                        const rect = exportButtonRef.current.getBoundingClientRect();
                        setExportMenuPosition({
                          top: rect.bottom + 8,
                          right: window.innerWidth - rect.right,
                        });
                      }
                      setShowExportMenu(!showExportMenu);
                    }}
                    className="flex items-center gap-2 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-xl transition-colors"
                  >
                    <Download className="w-5 h-5 text-neutral-300" />
                    <span className="text-neutral-200">Exportar</span>
                    <ChevronDown
                      className={`w-4 h-4 text-neutral-400 transition-transform ${
                        showExportMenu ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Dropdown renderizado via Portal */}
                  {typeof document !== "undefined" &&
                    showExportMenu &&
                    createPortal(
                      <div
                        className="export-dropdown-portal"
                        style={{
                          position: "fixed",
                          top: exportMenuPosition.top,
                          right: exportMenuPosition.right,
                          zIndex: 9999,
                        }}
                      >
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="w-48 bg-neutral-800 border border-neutral-700 rounded-xl shadow-2xl overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              exportarCSV();
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-700 transition-colors text-left cursor-pointer"
                          >
                            <FileText className="w-5 h-5 text-green-400" />
                            <div>
                              <p className="text-neutral-200 font-medium">CSV</p>
                              <p className="text-xs text-neutral-400">
                                Planilha Excel
                              </p>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              exportarWord();
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-700 transition-colors text-left border-t border-neutral-700 cursor-pointer"
                          >
                            <FileText className="w-5 h-5 text-blue-400" />
                            <div>
                              <p className="text-neutral-200 font-medium">Word</p>
                              <p className="text-xs text-neutral-400">
                                Documento formatado
                              </p>
                            </div>
                          </button>
                        </motion.div>
                      </div>,
                      document.body
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 py-6">
          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-neutral-900/95 backdrop-blur-xl rounded-xl border border-neutral-800 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Building2 className="w-6 h-6 text-blue-400" />
                </div>
                <span className="text-sm text-neutral-400">Total</span>
              </div>
              <p className="text-3xl font-bold text-neutral-50">
                {estatisticas.totalEmpresas}
              </p>
              <p className="text-sm text-neutral-400 mt-1">Empresas</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-neutral-900/95 backdrop-blur-xl rounded-xl border border-neutral-800 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <DollarSign className="w-6 h-6 text-amber-400" />
                </div>
                <span className="text-sm text-neutral-400">Valor</span>
              </div>
              <p className="text-2xl font-bold text-neutral-50">
                {formatCurrency(estatisticas.valorTotal)}
              </p>
              <p className="text-sm text-neutral-400 mt-1">Total em boletos</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-neutral-900/95 backdrop-blur-xl rounded-xl border border-neutral-800 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <span className="text-sm text-red-400">
                  {estatisticas.boletosVencidos} boletos
                </span>
              </div>
              <p className="text-2xl font-bold text-neutral-50">
                {formatCurrency(estatisticas.valorVencido)}
              </p>
              <p className="text-sm text-neutral-400 mt-1">Valor vencido</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-neutral-900/95 backdrop-blur-xl rounded-xl border border-neutral-800 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <span className="text-sm text-green-400">
                  {estatisticas.boletosLiquidados} boletos
                </span>
              </div>
              <p className="text-2xl font-bold text-neutral-50">
                {formatCurrency(estatisticas.valorLiquidado)}
              </p>
              <p className="text-sm text-neutral-400 mt-1">Valor liquidado</p>
            </motion.div>
          </div>

          {/* Filtros e Busca */}
          <div className="bg-neutral-900/95 backdrop-blur-xl rounded-xl border border-neutral-800 p-6 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Busca */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                  <input
                    type="text"
                    placeholder="Buscar por empresa, documento ou contrato..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Filtros */}
              <div className="flex flex-wrap gap-3">
                <select
                  value={filtroStatus}
                  onChange={(e) =>
                    setFiltroStatus(e.target.value as FiltroStatus)
                  }
                  className="px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="todos">Todos os Status</option>
                  <option value="pendente">Pendentes</option>
                  <option value="vencido">Vencidos</option>
                  <option value="liquidado">Liquidados</option>
                </select>

                <select
                  value={filtroFilial}
                  onChange={(e) => setFiltroFilial(e.target.value)}
                  className="px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="todas">Todas as Filiais</option>
                  {filiaisDisponiveis.map((filial) => (
                    <option key={filial} value={filial}>
                      {filial}
                    </option>
                  ))}
                </select>

                <select
                  value={ordenacao}
                  onChange={(e) =>
                    setOrdenacao(e.target.value as OrdenacaoTipo)
                  }
                  className="px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="nome">Ordenar por Nome</option>
                  <option value="valor">Ordenar por Valor</option>
                  <option value="boletos">Ordenar por Qtd Boletos</option>
                  <option value="vencidos">Ordenar por Vencidos</option>
                </select>

                <button
                  onClick={() => setOrdemAscendente(!ordemAscendente)}
                  className="p-3 bg-neutral-800/50 hover:bg-neutral-700 border border-neutral-700 rounded-xl transition-colors"
                  title={
                    ordemAscendente ? "Ordem crescente" : "Ordem decrescente"
                  }
                >
                  <ArrowUpDown className="w-5 h-5 text-neutral-300" />
                </button>

                <div className="flex gap-2 ml-auto">
                  <button
                    onClick={expandirTodas}
                    className="px-4 py-3 bg-neutral-800/50 hover:bg-neutral-700 border border-neutral-700 rounded-xl text-neutral-300 transition-colors text-sm"
                  >
                    Expandir Todas
                  </button>
                  <button
                    onClick={recolherTodas}
                    className="px-4 py-3 bg-neutral-800/50 hover:bg-neutral-700 border border-neutral-700 rounded-xl text-neutral-300 transition-colors text-sm"
                  >
                    Recolher Todas
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Empresas */}
          <div className="space-y-4">
            {empresasFiltradas.length === 0 ? (
              <div className="bg-neutral-900/95 backdrop-blur-xl rounded-xl border border-neutral-800 p-12 text-center">
                <Users className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                <p className="text-xl text-neutral-400 mb-2">
                  Nenhuma empresa encontrada
                </p>
                <p className="text-sm text-neutral-500">
                  Tente ajustar os filtros ou realizar uma nova busca
                </p>
              </div>
            ) : (
              paginatedEmpresas.map((empresa, index) => {
                const isExpanded = empresasExpandidas.has(empresa.id);
                const taxaLiquidacao =
                  empresa.totalBoletos > 0
                    ? (empresa.boletosLiquidados / empresa.totalBoletos) * 100
                    : 0;

                return (
                  <motion.div
                    key={empresa.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-neutral-900/95 backdrop-blur-xl rounded-xl border border-neutral-800 overflow-hidden"
                  >
                    {/* Cabeçalho da Empresa */}
                    <div
                      className="p-6 cursor-pointer hover:bg-neutral-800/30 transition-colors"
                      onClick={() => toggleEmpresa(empresa.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <motion.div
                            animate={{ rotate: isExpanded ? 90 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown className="w-6 h-6 text-amber-400" />
                          </motion.div>

                          <div className="p-3 bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-lg border border-amber-500/30">
                            <Building2 className="w-6 h-6 text-amber-400" />
                          </div>

                          <div>
                            <h3 className="text-lg font-semibold text-neutral-50">
                              {empresa.nome}
                            </h3>
                            <p className="text-sm text-neutral-400">
                              {formatDocument(empresa.documento)} •{" "}
                              {empresa.totalBoletos} boleto
                              {empresa.totalBoletos !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          {/* Indicadores de Status */}
                          <div className="flex gap-3">
                            {empresa.boletosVencidos > 0 && (
                              <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium">
                                {empresa.boletosVencidos} vencido
                                {empresa.boletosVencidos !== 1 ? "s" : ""}
                              </span>
                            )}
                            {empresa.boletosPendentes > 0 && (
                              <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-sm font-medium">
                                {empresa.boletosPendentes} pendente
                                {empresa.boletosPendentes !== 1 ? "s" : ""}
                              </span>
                            )}
                            {empresa.boletosLiquidados > 0 && (
                              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm font-medium">
                                {empresa.boletosLiquidados} liquidado
                                {empresa.boletosLiquidados !== 1 ? "s" : ""}
                              </span>
                            )}
                          </div>

                          {/* Valor Total */}
                          <div className="text-right">
                            <p className="text-sm text-neutral-400">
                              Valor Total
                            </p>
                            <p className="text-xl font-bold text-neutral-50">
                              {formatCurrency(empresa.valorTotal)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Barra de Progresso */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-neutral-400">
                            Taxa de Liquidação
                          </span>
                          <span className="text-xs font-medium text-green-400">
                            {taxaLiquidacao.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${taxaLiquidacao}%` }}
                            transition={{ duration: 0.5, delay: index * 0.05 }}
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Detalhes Expandidos */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="border-t border-neutral-800"
                        >
                          {/* Resumo Financeiro */}
                          <div className="p-6 bg-neutral-800/30">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                              <div className="bg-neutral-900/50 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <Receipt className="w-4 h-4 text-neutral-400" />
                                  <span className="text-sm text-neutral-400">
                                    Pendente
                                  </span>
                                </div>
                                <p className="text-lg font-semibold text-amber-400">
                                  {formatCurrency(empresa.valorPendente)}
                                </p>
                              </div>
                              <div className="bg-neutral-900/50 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <AlertTriangle className="w-4 h-4 text-neutral-400" />
                                  <span className="text-sm text-neutral-400">
                                    Vencido
                                  </span>
                                </div>
                                <p className="text-lg font-semibold text-red-400">
                                  {formatCurrency(empresa.valorVencido)}
                                </p>
                              </div>
                              <div className="bg-neutral-900/50 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <CheckCircle className="w-4 h-4 text-neutral-400" />
                                  <span className="text-sm text-neutral-400">
                                    Liquidado
                                  </span>
                                </div>
                                <p className="text-lg font-semibold text-green-400">
                                  {formatCurrency(empresa.valorLiquidado)}
                                </p>
                              </div>
                              <div className="bg-neutral-900/50 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <BarChart3 className="w-4 h-4 text-neutral-400" />
                                  <span className="text-sm text-neutral-400">
                                    Total
                                  </span>
                                </div>
                                <p className="text-lg font-semibold text-amber-400">
                                  {formatCurrency(empresa.valorTotal)}
                                </p>
                              </div>
                            </div>

                            {/* Lista de Boletos */}
                            <div className="space-y-3">
                              {empresa.faturas
                                .sort(
                                  (a, b) =>
                                    new Date(a.dataVencimento).getTime() -
                                    new Date(b.dataVencimento).getTime()
                                )
                                .map((fatura) => (
                                  <motion.div
                                    key={fatura.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="bg-neutral-900/70 rounded-lg p-4 flex items-center justify-between hover:bg-neutral-900 transition-colors"
                                  >
                                    <div className="flex items-center gap-4">
                                      <div className="p-2 bg-neutral-800 rounded-lg">
                                        <FileText className="w-4 h-4 text-neutral-400" />
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <p className="text-sm font-medium text-neutral-200">
                                            {fatura.numeroContrato ||
                                              "Sem contrato"}
                                          </p>
                                          {(() => {
                                            const tipoCfg = getTipoBoletoConfig(fatura.tipoBoletoManual);
                                            return tipoCfg ? (
                                              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md border ${tipoCfg.className}`}>
                                                <Tag className="w-3 h-3" />
                                                {tipoCfg.label}
                                              </span>
                                            ) : null;
                                          })()}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1">
                                          <span className="text-xs text-neutral-400">
                                            Boleto #{fatura.boletoId}
                                          </span>
                                          <span className="text-xs text-neutral-500">
                                            •
                                          </span>
                                          <span className="text-xs text-neutral-400 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {formatDate(fatura.dataVencimento)}
                                          </span>
                                          {fatura.diasAtraso > 0 && (
                                            <>
                                              <span className="text-xs text-neutral-500">
                                                •
                                              </span>
                                              <span className="text-xs text-red-400">
                                                {fatura.diasAtraso} dia
                                                {fatura.diasAtraso !== 1
                                                  ? "s"
                                                  : ""}{" "}
                                                atraso
                                              </span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                      <span
                                        className={`px-3 py-1 rounded-lg text-xs font-medium border ${getStatusColor(
                                          fatura.status
                                        )}`}
                                      >
                                        {getStatusLabel(fatura.status)}
                                      </span>
                                      <div className="text-right">
                                        <p className="text-lg font-semibold text-neutral-50">
                                          {formatCurrency(fatura.valor)}
                                        </p>
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleVerDetalhes(fatura.boleto);
                                        }}
                                        className="p-2 hover:bg-amber-500/20 rounded-lg transition-colors"
                                      >
                                        <Eye className="w-4 h-4 text-amber-400" />
                                      </button>
                                    </div>
                                  </motion.div>
                                ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}

            {/* Paginação */}
            {empresasFiltradas.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 bg-neutral-900/95 backdrop-blur-xl rounded-xl border border-neutral-800">
                <div className="text-sm text-neutral-400">
                  Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                  {Math.min(currentPage * ITEMS_PER_PAGE, empresasFiltradas.length)} de {empresasFiltradas.length} empresas
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
                      if (page === currentPage - 2 || page === currentPage + 2) return true;
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
                        <span key={`ellipsis-${idx}`} className="px-2 text-neutral-500 text-xs">
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
                      )
                    )}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-2 text-sm font-medium text-neutral-300 bg-neutral-800 border border-neutral-700 rounded-lg hover:bg-neutral-700 hover:border-amber-500/50 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-neutral-800 disabled:hover:border-neutral-700"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal de Detalhes do Boleto */}
        <AnimatePresence>
          {mostrarDetalhes && boletoSelecionado && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setMostrarDetalhes(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-neutral-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-neutral-800"
              >
                <div className="sticky top-0 bg-gradient-to-r from-amber-500 to-amber-600 p-6 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-neutral-950">
                      Detalhes do Boleto
                    </h2>
                    <button
                      onClick={() => setMostrarDetalhes(false)}
                      className="p-2 hover:bg-black/20 rounded-lg transition-colors"
                    >
                      <X className="w-6 h-6 text-neutral-950" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Informações principais */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-neutral-400 mb-1">NSU</p>
                      <p className="text-lg font-medium text-neutral-100">
                        {boletoSelecionado.nsuCode}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-400 mb-1">Valor</p>
                      <p className="text-lg font-bold text-amber-400">
                        {formatCurrency(boletoSelecionado.nominalValue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-400 mb-1">
                        Vencimento
                      </p>
                      <p className="text-lg font-medium text-neutral-100">
                        {formatDate(boletoSelecionado.dueDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-400 mb-1">Status</p>
                      <span
                        className={`inline-flex px-3 py-1 rounded-lg text-sm font-medium border ${getStatusColor(
                          boletoSelecionado.status
                        )}`}
                      >
                        {getStatusLabel(boletoSelecionado.status)}
                      </span>
                    </div>
                  </div>

                  {/* Dados do pagador */}
                  <div className="bg-neutral-800/50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-neutral-100 mb-3">
                      Dados do Pagador
                    </h3>
                    <div className="space-y-2">
                      <p className="text-neutral-300">
                        <span className="text-neutral-400">Nome:</span>{" "}
                        {boletoSelecionado.payerName}
                      </p>
                      <p className="text-neutral-300">
                        <span className="text-neutral-400">Documento:</span>{" "}
                        {formatDocument(boletoSelecionado.payerDocumentNumber)}
                      </p>
                      <p className="text-neutral-300">
                        <span className="text-neutral-400">Endereço:</span>{" "}
                        {boletoSelecionado.payerAddress}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MainLayout>
  );
}
