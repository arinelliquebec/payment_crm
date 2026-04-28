// src/app/contratos/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  AlertCircle,
  Loader2,
  TrendingUp,
  Clock,
  DollarSign,
  Phone,
  Mail,
  Calendar,
  Filter,
  RefreshCcw,
  Users,
  Building2,
  CheckCircle,
  XCircle,
  History,
  ChevronDown,
} from "lucide-react";
import MainLayout from "@/components/MainLayout";
import ContratoForm from "@/components/forms/ContratoForm";
import ContratoDetalhes from "@/components/ContratoDetalhes";
import MudancaSituacaoModal from "@/components/MudancaSituacaoModal";
import { Tooltip } from "@/components";
import { useContratos } from "@/hooks/useContratos";
import { useClientes } from "@/hooks/useClientes";
import { useConsultores } from "@/hooks/useConsultores";
import {
  Contrato,
  CreateContratoDTO,
  UpdateContratoDTO,
  MudancaSituacaoDTO,
  SituacaoContratoOptions,
  SituacaoContrato,
} from "@/types/api";
import { cn } from "@/lib/utils";
import { useForm } from "@/contexts/FormContext";
import { format, isAfter, isBefore, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

function SituacaoBadge({ situacao }: { situacao: SituacaoContrato }) {
  const config = SituacaoContratoOptions.find((opt) => opt.value === situacao);

  if (!config) {
    return <span className="text-xs text-gray-500">Desconhecido</span>;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        config.color
      )}
    >
      {config.label}
    </span>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
    </div>
  );
}

function ErrorMessage({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-red-50 border border-red-200 rounded-xl p-6 text-center"
    >
      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-red-900 mb-2">
        Erro ao carregar dados
      </h3>
      <p className="text-red-700 mb-4">{message}</p>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onRetry}
        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200"
      >
        Tentar novamente
      </motion.button>
    </motion.div>
  );
}

export default function ContratosPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroSituacao, setFiltroSituacao] = useState<
    SituacaoContrato | "todas"
  >("todas");
  const [filtroConsultor, setFiltroConsultor] = useState<number | "todos">(
    "todos"
  );
  const [filtroProximoContato, setFiltroProximoContato] = useState<
    "hoje" | "semana" | "mes" | "todos"
  >("todos");
  const [selectedContrato, setSelectedContrato] = useState<Contrato | null>(
    null
  );
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [showDetalhes, setShowDetalhes] = useState(false);
  const [showMudancaSituacao, setShowMudancaSituacao] = useState(false);
  const { openForm, closeForm } = useForm();
  const [activeTab, setActiveTab] = useState<"contratos" | "clientes">(
    "contratos"
  );

  // Debug para produção
  useEffect(() => {
    console.log("🔧 ContratosPage: Página carregada");
    console.log("🔧 ContratosPage: Environment:", process.env.NODE_ENV);
    console.log("🔧 ContratosPage: API URL:", process.env.NEXT_PUBLIC_API_URL);
  }, []);

  const {
    contratos,
    loading,
    error,
    creating,
    updating,
    deleting,
    changingSituacao,
    fetchContratos,
    createContrato,
    updateContrato,
    mudarSituacao,
    deleteContrato,
  } = useContratos();

  const { clientes } = useClientes();
  const { consultores } = useConsultores();
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState<
    number | null
  >(null);

  // Debug para verificar se os hooks estão funcionando
  useEffect(() => {
    console.log("🔧 ContratosPage: Contratos carregados:", contratos.length);
    console.log("🔧 ContratosPage: Loading:", loading);
    console.log("🔧 ContratosPage: Error:", error);
    console.log("🔧 ContratosPage: Clientes:", clientes.length);
    console.log("🔧 ContratosPage: Consultores:", consultores.length);
  }, [contratos, loading, error, clientes, consultores]);

  // Filtrar contratos
  const contratosFiltrados = useMemo(() => {
    return contratos.filter((contrato) => {
      // Filtro de busca
      if (searchTerm) {
        const termo = searchTerm.toLowerCase();

        // Buscar em múltiplos campos para maior flexibilidade
        const clienteNome =
          contrato.cliente?.pessoaFisica?.nome ||
          contrato.cliente?.pessoaJuridica?.razaoSocial ||
          "";
        const consultorNome = contrato.consultor?.pessoaFisica?.nome || "";
        const clienteEmail =
          contrato.cliente?.pessoaFisica?.email ||
          contrato.cliente?.pessoaJuridica?.email ||
          "";
        const clienteCpfCnpj =
          contrato.cliente?.pessoaFisica?.cpf ||
          contrato.cliente?.pessoaJuridica?.cnpj ||
          "";
        const numeroPasta = contrato.numeroPasta || "";
        const tipoServico = contrato.tipoServico || "";
        const situacao = contrato.situacao || "";

        // Debug: log dos dados para verificar estrutura
        if (searchTerm && contratos.length > 0 && contrato === contratos[0]) {
          console.log("🔍 Debug busca - Primeiro contrato:", {
            searchTerm: termo,
            clienteNome,
            consultorNome,
            clienteEmail,
            clienteCpfCnpj,
            numeroPasta,
            tipoServico,
            situacao,
            cliente: contrato.cliente,
            consultor: contrato.consultor,
          });
        }

        // Buscar em todos os campos relevantes
        const campos = [
          clienteNome,
          consultorNome,
          clienteEmail,
          clienteCpfCnpj,
          numeroPasta,
          tipoServico,
          situacao,
        ];

        const encontrado = campos.some(
          (campo) => campo && campo.toLowerCase().includes(termo)
        );

        if (!encontrado) {
          return false;
        }
      }

      // Filtro de situação
      if (filtroSituacao !== "todas" && contrato.situacao !== filtroSituacao) {
        return false;
      }

      // Filtro de consultor
      if (
        filtroConsultor !== "todos" &&
        contrato.consultorId !== filtroConsultor
      ) {
        return false;
      }

      // Filtro de próximo contato
      if (filtroProximoContato !== "todos") {
        // Verificar se a data existe antes de fazer o parse
        if (!contrato.dataProximoContato) {
          return false;
        }

        try {
          const dataProximoContato = parseISO(contrato.dataProximoContato);
          const hoje = new Date();
          hoje.setHours(0, 0, 0, 0);

          switch (filtroProximoContato) {
            case "hoje":
              const amanha = new Date(hoje);
              amanha.setDate(amanha.getDate() + 1);
              if (
                !isAfter(dataProximoContato, hoje) ||
                !isBefore(dataProximoContato, amanha)
              ) {
                return false;
              }
              break;
            case "semana":
              const proximaSemana = new Date(hoje);
              proximaSemana.setDate(proximaSemana.getDate() + 7);
              if (
                !isAfter(dataProximoContato, hoje) ||
                !isBefore(dataProximoContato, proximaSemana)
              ) {
                return false;
              }
              break;
            case "mes":
              const proximoMes = new Date(hoje);
              proximoMes.setMonth(proximoMes.getMonth() + 1);
              if (
                !isAfter(dataProximoContato, hoje) ||
                !isBefore(dataProximoContato, proximoMes)
              ) {
                return false;
              }
              break;
          }
        } catch {
          return false;
        }
      }

      return true;
    });
  }, [
    contratos,
    searchTerm,
    filtroSituacao,
    filtroConsultor,
    filtroProximoContato,
  ]);

  // Filtrar clientes na aba de clientes
  const clientesFiltrados = useMemo(() => {
    if (!searchTerm) return clientes;

    const termo = searchTerm.toLowerCase();
    console.log("🔍 Filtro clientes - Termo de busca:", termo);
    console.log("🔍 Filtro clientes - Total de clientes:", clientes.length);

    const filtrados = clientes.filter((cliente) => {
      const nome = cliente.nome || cliente.razaoSocial || "";
      const email = cliente.email || "";
      const cpfCnpj = cliente.cpf || cliente.cnpj || "";
      const telefone = cliente.telefone1 || "";
      const filial =
        typeof cliente.filial === "string"
          ? cliente.filial
          : cliente.filial?.nome || "";

      // Debug do primeiro cliente
      if (cliente === clientes[0]) {
        console.log("🔍 Debug primeiro cliente:", {
          nome,
          email,
          cpfCnpj,
          telefone,
          filial,
          clienteCompleto: cliente,
        });
      }

      const match =
        nome.toLowerCase().includes(termo) ||
        email.toLowerCase().includes(termo) ||
        cpfCnpj.toLowerCase().includes(termo) ||
        telefone.toLowerCase().includes(termo) ||
        filial.toLowerCase().includes(termo);

      return match;
    });

    console.log("🔍 Filtro clientes - Clientes filtrados:", filtrados.length);
    return filtrados;
  }, [clientes, searchTerm]);

  // Estatísticas
  const estatisticas = useMemo(() => {
    const total = contratos.length;
    // Atualizar para as novas situações
    const emNegociacao = contratos.filter(
      (c) => c.situacao === "Contrato Enviado" || c.situacao === "Prospecto"
    ).length;
    const fechados = contratos.filter(
      (c) => c.situacao === "Contrato Assinado" || c.situacao === "CLIENTE"
    ).length;
    const valorTotal = contratos.reduce(
      (acc, c) => acc + (c.valorDevido || 0),
      0
    );
    const valorNegociado = contratos
      .filter((c) => c.valorNegociado)
      .reduce((acc, c) => acc + (c.valorNegociado || 0), 0);

    return {
      total,
      emNegociacao,
      fechados,
      valorTotal,
      valorNegociado,
      taxaConversao: total > 0 ? ((fechados / total) * 100).toFixed(1) : "0",
    };
  }, [contratos]);

  const handleCreateContrato = async (
    data: CreateContratoDTO | Partial<UpdateContratoDTO>
  ) => {
    try {
      await createContrato(data as CreateContratoDTO);
      closeForm();
    } catch (error) {
      console.error("Erro ao criar contrato:", error);
    }
  };

  const handleUpdateContrato = async (
    id: number,
    data: Partial<UpdateContratoDTO>
  ) => {
    try {
      await updateContrato(id, data);
      closeForm();
      setSelectedContrato(null);
    } catch (error) {
      console.error("Erro ao atualizar contrato:", error);
    }
  };

  const handleMudarSituacao = async (data: MudancaSituacaoDTO) => {
    if (!selectedContrato) return;

    try {
      await mudarSituacao(selectedContrato.id, data);
      setShowMudancaSituacao(false);
      setSelectedContrato(null);
    } catch (error) {
      console.error("Erro ao mudar situação:", error);
    }
  };

  const handleDeleteContrato = async (id: number) => {
    console.log(
      "🔧 handleDeleteContrato: ID recebido:",
      id,
      "Tipo:",
      typeof id
    );

    // Validação do ID
    if (id === undefined || id === null || isNaN(id)) {
      console.error("🔧 handleDeleteContrato: ID inválido recebido:", id);
      alert("Erro: ID do contrato inválido");
      return;
    }

    if (window.confirm("Tem certeza que deseja excluir este contrato?")) {
      try {
        console.log(
          "🔧 handleDeleteContrato: Confirmado, chamando deleteContrato com ID:",
          id
        );
        await deleteContrato(id);
      } catch (error) {
        console.error("Erro ao excluir contrato:", error);
      }
    }
  };

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

  const isProximoContatoVencido = (data: string | null | undefined) => {
    if (!data) return false;
    try {
      return isBefore(parseISO(data), new Date());
    } catch {
      return false;
    }
  };

  if (loading && contratos.length === 0) {
    return (
      <MainLayout>
        <LoadingSpinner />
      </MainLayout>
    );
  }

  if (error && contratos.length === 0) {
    return (
      <MainLayout>
        <ErrorMessage message={error} onRetry={fetchContratos} />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header com Estatísticas */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200/60 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">
                Gestão de Contratos
              </h1>
              <p className="text-sm text-neutral-600 mt-1">
                Gerencie contratos e acompanhe negociações
              </p>
            </div>
            {/* Botão de Novo Contrato removido conforme solicitação */}
          </div>

          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-600">
                    Total de Contratos
                  </p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">
                    {estatisticas.total}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-blue-500 opacity-50" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl border border-yellow-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-yellow-600">
                    Em Andamento
                  </p>
                  <p className="text-2xl font-bold text-yellow-900 mt-1">
                    {estatisticas.emNegociacao}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500 opacity-50" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-600">
                    Concluídos
                  </p>
                  <p className="text-2xl font-bold text-green-900 mt-1">
                    {estatisticas.fechados}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500 opacity-50" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-purple-600">
                    Valor Total
                  </p>
                  <p className="text-lg font-bold text-purple-900 mt-1">
                    {formatCurrency(estatisticas.valorTotal)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-500 opacity-50" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-xl border border-indigo-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-indigo-600">
                    Taxa de Conversão
                  </p>
                  <p className="text-2xl font-bold text-indigo-900 mt-1">
                    {estatisticas.taxaConversao}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-indigo-500 opacity-50" />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Tabs Contratos / Clientes */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200/60 p-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("contratos")}
              className={cn(
                "flex-1 px-4 py-2 rounded-lg text-sm font-medium",
                activeTab === "contratos"
                  ? "bg-primary-100 text-primary-700"
                  : "text-neutral-600 hover:bg-neutral-50"
              )}
            >
              Contratos
            </button>
            <button
              onClick={() => setActiveTab("clientes")}
              className={cn(
                "flex-1 px-4 py-2 rounded-lg text-sm font-medium",
                activeTab === "clientes"
                  ? "bg-primary-100 text-primary-700"
                  : "text-neutral-600 hover:bg-neutral-50"
              )}
            >
              Clientes
            </button>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200/60 p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Busca */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Buscar por cliente, consultor, email, CPF/CNPJ, pasta, tipo de serviço..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Filtro de Situação */}
            <div className="relative">
              <select
                value={filtroSituacao}
                onChange={(e) =>
                  setFiltroSituacao(
                    e.target.value as SituacaoContrato | "todas"
                  )
                }
                className="appearance-none pl-10 pr-10 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all cursor-pointer"
              >
                <option value="todas">Todas as Situações</option>
                {SituacaoContratoOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>

            {/* Filtro de Consultor */}
            <div className="relative">
              <select
                value={filtroConsultor}
                onChange={(e) =>
                  setFiltroConsultor(
                    e.target.value === "todos"
                      ? "todos"
                      : Number(e.target.value)
                  )
                }
                className="appearance-none pl-10 pr-10 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all cursor-pointer"
              >
                <option value="todos">Todos os Consultores</option>
                {consultores.map((consultor) => (
                  <option key={consultor.id} value={consultor.id}>
                    {consultor.pessoaFisica?.nome || consultor.nome}
                  </option>
                ))}
              </select>
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>

            {/* Filtro de Próximo Contato */}
            <div className="relative">
              <select
                value={filtroProximoContato}
                onChange={(e) =>
                  setFiltroProximoContato(
                    e.target.value as "hoje" | "semana" | "mes" | "todos"
                  )
                }
                className="appearance-none pl-10 pr-10 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all cursor-pointer"
              >
                <option value="todos">Todos os Prazos</option>
                <option value="hoje">Vence Hoje</option>
                <option value="semana">Vence esta Semana</option>
                <option value="mes">Vence este Mês</option>
              </select>
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>

            {/* Toggle View Mode */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("cards")}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  viewMode === "cards"
                    ? "bg-primary-100 text-primary-600"
                    : "bg-neutral-50 text-neutral-400 hover:bg-neutral-100"
                )}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  viewMode === "table"
                    ? "bg-primary-100 text-primary-600"
                    : "bg-neutral-50 text-neutral-400 hover:bg-neutral-100"
                )}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <rect x="3" y="3" width="18" height="18" rx="1" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="3" y1="15" x2="21" y2="15" />
                  <line x1="9" y1="3" x2="9" y2="21" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Contratos */}
        {activeTab === "contratos" &&
          (viewMode === "cards" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {contratosFiltrados.map((contrato, index) => (
                  <motion.div
                    key={contrato.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-xl shadow-sm border border-neutral-200/60 hover:shadow-lg transition-all duration-300 overflow-hidden group"
                  >
                    {/* Header do Card */}
                    <div className="p-4 border-b border-neutral-100">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-neutral-900 truncate">
                            {(() => {
                              const nome =
                                contrato.cliente?.pessoaFisica?.nome ||
                                contrato.cliente?.pessoaJuridica?.razaoSocial;
                              if (nome) return nome;
                              // fallback: se não veio o objeto cliente, tentar exibir pelo id
                              return contrato.clienteId
                                ? `Cliente #${contrato.clienteId}`
                                : "Cliente não identificado";
                            })()}
                          </h3>
                          <p className="text-xs text-neutral-500 mt-1">
                            #{index + 1} • {formatDate(contrato.dataCadastro)}
                          </p>
                        </div>
                        <SituacaoBadge situacao={contrato.situacao} />
                      </div>
                    </div>

                    {/* Corpo do Card */}
                    <div className="p-4 space-y-3">
                      {/* Consultor */}
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-neutral-400" />
                        <span className="text-sm text-neutral-600">
                          {contrato.consultor?.pessoaFisica?.nome ||
                            "Sem consultor"}
                        </span>
                      </div>

                      {/* Valores */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs text-neutral-500">
                            Valor Devido
                          </p>
                          <p className="text-sm font-semibold text-neutral-900">
                            {formatCurrency(contrato.valorDevido)}
                          </p>
                        </div>
                        {contrato.valorNegociado && (
                          <div>
                            <p className="text-xs text-neutral-500">
                              Negociado
                            </p>
                            <p className="text-sm font-semibold text-green-600">
                              {formatCurrency(contrato.valorNegociado)}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Datas de Contato */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-neutral-400" />
                          <span className="text-xs text-neutral-600">
                            Último: {formatDate(contrato.dataUltimoContato)}
                          </span>
                        </div>
                        <div
                          className={cn(
                            "flex items-center gap-2",
                            isProximoContatoVencido(
                              contrato.dataProximoContato
                            ) && "text-red-600"
                          )}
                        >
                          <Calendar className="w-4 h-4" />
                          <span className="text-xs font-medium">
                            Próximo: {formatDate(contrato.dataProximoContato)}
                          </span>
                        </div>
                      </div>

                      {/* Observações */}
                      {contrato.observacoes && (
                        <p className="text-xs text-neutral-500 line-clamp-2">
                          {contrato.observacoes}
                        </p>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="p-4 bg-neutral-50 border-t border-neutral-100">
                      <div className="flex items-center gap-2">
                        <Tooltip content="Ver Detalhes">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setSelectedContrato(contrato);
                              setShowDetalhes(true);
                            }}
                            className="flex-1 flex items-center justify-center gap-1 p-2 bg-white hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="text-xs font-medium">
                              Detalhes
                            </span>
                          </motion.button>
                        </Tooltip>

                        <Tooltip content="Mudar Situação">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setSelectedContrato(contrato);
                              setShowMudancaSituacao(true);
                            }}
                            className="flex-1 flex items-center justify-center gap-1 p-2 bg-white hover:bg-yellow-50 text-yellow-600 rounded-lg transition-colors"
                          >
                            <RefreshCcw className="w-4 h-4" />
                            <span className="text-xs font-medium">
                              Situação
                            </span>
                          </motion.button>
                        </Tooltip>

                        <Tooltip content="Editar">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setSelectedContrato(contrato);
                              openForm();
                            }}
                            className="p-2 bg-white hover:bg-primary-50 text-primary-600 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </motion.button>
                        </Tooltip>

                        <Tooltip content="Excluir">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDeleteContrato(contrato.id)}
                            className="p-2 bg-white hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </Tooltip>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            /* View de Tabela */
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200/60 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                        Consultor
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                        Situação
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                        Valores
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                        Próximo Contato
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-neutral-600 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {contratosFiltrados.map((contrato, index) => (
                      <tr
                        key={contrato.id}
                        className="hover:bg-neutral-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-neutral-900">
                              {contrato.cliente?.pessoaFisica?.nome ||
                                contrato.cliente?.pessoaJuridica?.razaoSocial}
                            </p>
                            <p className="text-xs text-neutral-500">
                              #{index + 1}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-neutral-700">
                            {contrato.consultor?.pessoaFisica?.nome}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <SituacaoBadge situacao={contrato.situacao} />
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-neutral-900">
                              {formatCurrency(contrato.valorDevido)}
                            </p>
                            {contrato.valorNegociado && (
                              <p className="text-xs text-green-600">
                                Neg: {formatCurrency(contrato.valorNegociado)}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p
                            className={cn(
                              "text-sm",
                              isProximoContatoVencido(
                                contrato.dataProximoContato
                              )
                                ? "text-red-600 font-medium"
                                : "text-neutral-700"
                            )}
                          >
                            {formatDate(contrato.dataProximoContato)}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <Tooltip content="Ver">
                              <button
                                onClick={() => {
                                  setSelectedContrato(contrato);
                                  setShowDetalhes(true);
                                }}
                                className="p-1.5 hover:bg-blue-50 text-blue-600 rounded transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </Tooltip>
                            <Tooltip content="Mudar Situação">
                              <button
                                onClick={() => {
                                  setSelectedContrato(contrato);
                                  setShowMudancaSituacao(true);
                                }}
                                className="p-1.5 hover:bg-yellow-50 text-yellow-600 rounded transition-colors"
                              >
                                <RefreshCcw className="w-4 h-4" />
                              </button>
                            </Tooltip>
                            <Tooltip content="Editar">
                              <button
                                onClick={() => {
                                  setSelectedContrato(contrato);
                                  openForm();
                                }}
                                className="p-1.5 hover:bg-primary-50 text-primary-600 rounded transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            </Tooltip>
                            <Tooltip content="Excluir">
                              <button
                                onClick={() =>
                                  handleDeleteContrato(contrato.id)
                                }
                                className="p-1.5 hover:bg-red-50 text-red-600 rounded transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

        {/* Tabela de Clientes (igual a /clientes, simplificada) */}
        {activeTab === "clientes" && (
          <>
            {clientesFiltrados.length > 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-neutral-200/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-50 border-b border-neutral-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                          Cliente
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                          Documento
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                          Contato
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                          Filial
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {clientesFiltrados.map((cliente, index) => (
                        <motion.tr
                          key={cliente.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.02 * index }}
                          onDoubleClick={() => {
                            setClienteSelecionadoId(cliente.id);
                            openForm();
                          }}
                          className="hover:bg-neutral-50 cursor-pointer"
                        >
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-neutral-900">
                              {cliente.nome || cliente.razaoSocial}
                            </div>
                            <div className="text-xs text-neutral-500">
                              {cliente.email || "N/A"}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-neutral-700">
                            {cliente.tipo === "fisica" ? "Física" : "Jurídica"}
                          </td>
                          <td className="px-4 py-3 text-sm text-neutral-700">
                            {cliente.cpf || cliente.cnpj || "—"}
                          </td>
                          <td className="px-4 py-3 text-sm text-neutral-700">
                            {cliente.telefone1 || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-sm text-neutral-700">
                            {cliente.filial?.nome || "Não informada"}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-xl shadow-sm border border-neutral-200/60 p-12 text-center"
              >
                <Users className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  Nenhum cliente encontrado
                </h3>
                <p className="text-neutral-600 mb-6">
                  {searchTerm
                    ? "Tente ajustar o termo de busca para ver mais resultados"
                    : "Não há clientes cadastrados no sistema"}
                </p>
              </motion.div>
            )}
          </>
        )}

        {/* Mensagem quando não há contratos */}
        {activeTab === "contratos" && contratosFiltrados.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl shadow-sm border border-neutral-200/60 p-12 text-center"
          >
            <FileText className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              Nenhum contrato encontrado
            </h3>
            <p className="text-neutral-600 mb-6">
              {searchTerm ||
              filtroSituacao !== "todas" ||
              filtroConsultor !== "todos" ||
              filtroProximoContato !== "todos"
                ? "Tente ajustar os filtros para ver mais resultados"
                : "Comece criando um novo contrato"}
            </p>
            {/* Removido botão "Criar Primeiro Contrato" conforme solicitação */}
          </motion.div>
        )}
      </div>

      {/* Formulário de Contrato */}
      <ContratoForm
        contrato={selectedContrato}
        clientes={clientes}
        consultores={consultores}
        onSubmit={
          selectedContrato
            ? (data) => handleUpdateContrato(selectedContrato.id, data)
            : handleCreateContrato
        }
        onCancel={() => {
          setSelectedContrato(null);
          closeForm();
        }}
        initialClienteId={clienteSelecionadoId ?? undefined}
      />

      {/* Overlay antigo removido */}

      {/* Modal de Detalhes */}
      {showDetalhes && selectedContrato && (
        <ContratoDetalhes
          contrato={selectedContrato}
          onClose={() => {
            setShowDetalhes(false);
            setSelectedContrato(null);
          }}
          onEdit={() => {
            setShowDetalhes(false);
            openForm();
          }}
          onMudarSituacao={() => {
            setShowDetalhes(false);
            setShowMudancaSituacao(true);
          }}
        />
      )}

      {/* Modal de Mudança de Situação */}
      {showMudancaSituacao && selectedContrato && (
        <MudancaSituacaoModal
          contrato={selectedContrato}
          onSubmit={handleMudarSituacao}
          onClose={() => {
            setShowMudancaSituacao(false);
            setSelectedContrato(null);
          }}
        />
      )}
    </MainLayout>
  );
}
