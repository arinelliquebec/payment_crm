"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  FileText,
  CreditCard,
  FolderOpen,
  MessageSquare,
  User,
  Bell,
  LogOut,
  ChevronRight,
  ArrowLeft,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Download,
  Eye,
  Send,
  Paperclip,
  Search,
  Filter,
  Building2,
  Phone,
  Mail,
  MapPin,
  Edit,
  Save,
  X,
  DollarSign,
  FileDown,
  MessageCircle,
  HelpCircle,
  Shield,
  Loader2,
  RefreshCw,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useClienteAuth,
  ClienteAutenticado,
} from "@/contexts/ClienteAuthContext";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  usePortalClienteData,
  ContratoPortal,
  PagamentoPortal,
} from "@/hooks/usePortalClienteData";

// Tipos adicionais
interface DocumentoPortal {
  id: number;
  nome: string;
  tipo: string;
  dataUpload: string;
  tamanho: string;
  contratoId?: number;
}

interface MensagemChat {
  id: number;
  remetente: "cliente" | "consultor";
  mensagem: string;
  dataHora: string;
  lida: boolean;
}

// Dados mock apenas para mensagens e documentos (ainda não integrados)
const mockDocumentos: DocumentoPortal[] = [
  {
    id: 1,
    nome: "Contrato de Honorários",
    tipo: "PDF",
    dataUpload: "2024-01-15",
    tamanho: "245 KB",
    contratoId: 1,
  },
  {
    id: 2,
    nome: "Procuração",
    tipo: "PDF",
    dataUpload: "2024-01-15",
    tamanho: "120 KB",
    contratoId: 1,
  },
];

const mockMensagens: MensagemChat[] = [
  {
    id: 1,
    remetente: "consultor",
    mensagem: "Bem-vindo ao Portal do Cliente! Estamos à disposição.",
    dataHora: new Date().toISOString(),
    lida: false,
  },
];

// Componente de Navegação Lateral
function Sidebar({
  activeTab,
  setActiveTab,
  notificacoes,
  cliente,
  onLogout,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  notificacoes: number;
  cliente: ClienteAutenticado | null;
  onLogout: () => void;
}) {
  const menuItems = [
    { id: "dashboard", label: "Visão Geral", icon: Home },
    { id: "contratos", label: "Meus Contratos", icon: FileText },
    { id: "pagamentos", label: "Pagamentos", icon: CreditCard },
    { id: "documentos", label: "Documentos", icon: FolderOpen },
    {
      id: "mensagens",
      label: "Mensagens",
      icon: MessageSquare,
      badge: notificacoes,
    },
    { id: "perfil", label: "Meu Perfil", icon: User },
  ];

  return (
    <div className="w-64 bg-neutral-900/95 backdrop-blur-xl border-r border-neutral-800 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg shadow-amber-500/20">
            <Shield className="w-6 h-6 text-neutral-950" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gradient-amber">
              Portal do Cliente
            </h1>
            <p className="text-xs text-neutral-500">CRM JURÍDICO</p>
          </div>
        </div>
      </div>

      {/* Info do Cliente */}
      {cliente && (
        <div className="px-4 py-3 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center flex-shrink-0">
              {cliente.tipoPessoa === "Juridica" ? (
                <Building2 className="w-5 h-5 text-neutral-950" />
              ) : (
                <User className="w-5 h-5 text-neutral-950" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-neutral-200 truncate">
                {cliente.nome}
              </p>
              <p className="text-xs text-neutral-500 truncate">
                {cliente.documento}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
              activeTab === item.id
                ? "bg-gradient-to-r from-amber-500/20 to-amber-600/10 text-amber-400 border border-amber-500/30"
                : "text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge && item.badge > 0 && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-neutral-800">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
}

// Componente Dashboard
function DashboardTab({
  contratos,
  pagamentos,
  resumo,
}: {
  contratos: ContratoPortal[];
  pagamentos: PagamentoPortal[];
  resumo?: {
    totalContratos: number;
    contratosAtivos: number;
    valorTotalContratos: number;
    valorTotalPago: number;
    boletosPendentes: number;
    boletosVencidos: number;
    proximoPagamento: PagamentoPortal | null;
  } | null;
}) {
  // Usa resumo da API ou calcula localmente
  const totalContratos = resumo?.totalContratos ?? contratos.length;
  const contratosAtivos =
    resumo?.contratosAtivos ??
    contratos.filter((c) => !["Quitado", "RESCINDIDO"].includes(c.situacao))
      .length;
  const valorTotal =
    resumo?.valorTotalContratos ??
    contratos.reduce((acc, c) => acc + (c.valorTotal || 0), 0);
  const valorPago =
    resumo?.valorTotalPago ??
    contratos.reduce((acc, c) => acc + (c.valorPago || 0), 0);
  const proximosPagamentos = pagamentos
    .filter((p) => p.status === "pendente")
    .slice(0, 3);
  const boletosVencidos =
    resumo?.boletosVencidos ??
    pagamentos.filter((p) => p.status === "vencido").length;

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-neutral-900/95 backdrop-blur-xl p-6 rounded-xl border border-neutral-800 hover:border-amber-500/30 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl border border-blue-500/30">
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-neutral-400">Contratos</p>
              <p className="text-2xl font-bold text-neutral-50">
                {totalContratos}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-neutral-900/95 backdrop-blur-xl p-6 rounded-xl border border-neutral-800 hover:border-amber-500/30 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl border border-green-500/30">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-neutral-400">Em Andamento</p>
              <p className="text-2xl font-bold text-neutral-50">
                {contratosAtivos}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-neutral-900/95 backdrop-blur-xl p-6 rounded-xl border border-neutral-800 hover:border-amber-500/30 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-xl border border-amber-500/30">
              <DollarSign className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-neutral-400">Valor Total</p>
              <p className="text-2xl font-bold text-neutral-50">
                {valorTotal.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-neutral-900/95 backdrop-blur-xl p-6 rounded-xl border border-neutral-800 hover:border-amber-500/30 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl border border-purple-500/30">
              <TrendingUp className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-neutral-400">Já Pago</p>
              <p className="text-2xl font-bold text-green-400">
                {valorPago.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Próximos Pagamentos e Contratos Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximos Pagamentos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-neutral-900/95 backdrop-blur-xl rounded-xl border border-neutral-800"
        >
          <div className="p-4 border-b border-neutral-800">
            <h3 className="text-lg font-semibold text-neutral-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-500" />
              Próximos Pagamentos
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {proximosPagamentos.length > 0 ? (
              proximosPagamentos.map((pag) => (
                <div
                  key={pag.id}
                  className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-lg border border-neutral-700/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/20 rounded-lg">
                      <CreditCard className="w-4 h-4 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-200">
                        {pag.valor.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </p>
                      <p className="text-xs text-neutral-500">
                        Vence em{" "}
                        {format(parseISO(pag.dataVencimento), "dd/MM/yyyy")}
                      </p>
                    </div>
                  </div>
                  <button className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-neutral-950 text-xs font-medium rounded-lg transition-colors">
                    Pagar
                  </button>
                </div>
              ))
            ) : (
              <p className="text-neutral-500 text-center py-4">
                Nenhum pagamento pendente
              </p>
            )}
          </div>
        </motion.div>

        {/* Contratos Recentes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-neutral-900/95 backdrop-blur-xl rounded-xl border border-neutral-800"
        >
          <div className="p-4 border-b border-neutral-800">
            <h3 className="text-lg font-semibold text-neutral-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-500" />
              Meus Contratos
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {contratos.map((contrato) => (
              <div
                key={contrato.id}
                className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-lg border border-neutral-700/50 hover:border-amber-500/30 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <FileText className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-200">
                      {contrato.tipoServico}
                    </p>
                    <p className="text-xs text-neutral-500">
                      Pasta: {contrato.numeroPasta}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={cn(
                      "px-2 py-1 text-xs font-medium rounded-full",
                      contrato.situacao === "Quitado"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-blue-500/20 text-blue-400"
                    )}
                  >
                    {contrato.situacao}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Barra de Progresso Geral */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-neutral-900/95 backdrop-blur-xl p-6 rounded-xl border border-neutral-800"
      >
        <h3 className="text-lg font-semibold text-neutral-100 mb-4">
          Progresso dos Pagamentos
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-400">Total pago</span>
            <span className="text-amber-400 font-medium">
              {Math.round((valorPago / valorTotal) * 100)}%
            </span>
          </div>
          <div className="h-3 bg-neutral-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(valorPago / valorTotal) * 100}%` }}
              transition={{ delay: 0.8, duration: 1 }}
              className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"
            />
          </div>
          <div className="flex justify-between text-xs text-neutral-500">
            <span>
              {valorPago.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </span>
            <span>
              {valorTotal.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Componente Contratos
function ContratosTab({ contratos }: { contratos: ContratoPortal[] }) {
  const [selectedContrato, setSelectedContrato] =
    useState<ContratoPortal | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const contratosFiltrados = contratos.filter(
    (c) =>
      c.tipoServico.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.numeroPasta.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.consultorNome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gradient-amber">
          Meus Contratos
        </h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Buscar contrato..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-neutral-800/50 border border-neutral-700 rounded-lg text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      {contratosFiltrados.length === 0 ? (
        <div className="bg-neutral-900/95 backdrop-blur-xl rounded-xl border border-neutral-800 p-12 text-center">
          <FileText className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-300 mb-2">
            {contratos.length === 0
              ? "Nenhum contrato encontrado"
              : "Nenhum resultado"}
          </h3>
          <p className="text-neutral-500">
            {contratos.length === 0
              ? "Você ainda não possui contratos registrados."
              : "Tente buscar com outros termos."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {contratosFiltrados.map((contrato) => (
            <motion.div
              key={contrato.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-neutral-900/95 backdrop-blur-xl rounded-xl border border-neutral-800 hover:border-amber-500/30 transition-all overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-xl border border-amber-500/30">
                      <FileText className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-100">
                        {contrato.tipoServico}
                      </h3>
                      <p className="text-sm text-neutral-400 mt-1">
                        Pasta: {contrato.numeroPasta} • Consultor:{" "}
                        {contrato.consultorNome}
                      </p>
                      <div className="flex items-center gap-4 mt-3">
                        <span
                          className={cn(
                            "px-3 py-1 text-xs font-medium rounded-full",
                            contrato.situacao === "Quitado"
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          )}
                        >
                          {contrato.situacao}
                        </span>
                        <span className="text-xs text-neutral-500">
                          Início:{" "}
                          {format(parseISO(contrato.dataInicio), "dd/MM/yyyy")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-neutral-400">Valor Total</p>
                    <p className="text-xl font-bold text-neutral-100">
                      {contrato.valorTotal.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </p>
                  </div>
                </div>

                {/* Barra de Progresso */}
                <div className="mt-6 pt-4 border-t border-neutral-800">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-neutral-400">
                      Progresso do Pagamento
                    </span>
                    <span className="text-amber-400 font-medium">
                      {Math.round(
                        (contrato.valorPago / contrato.valorTotal) * 100
                      )}
                      %
                    </span>
                  </div>
                  <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all"
                      style={{
                        width: `${
                          (contrato.valorPago / contrato.valorTotal) * 100
                        }%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-neutral-500 mt-1">
                    <span>
                      Pago:{" "}
                      {contrato.valorPago.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </span>
                    <span>
                      Restante:{" "}
                      {(
                        contrato.valorTotal - contrato.valorPago
                      ).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </span>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-2 mt-4">
                  <button className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-neutral-950 rounded-lg text-sm font-medium transition-colors">
                    <Eye className="w-4 h-4" />
                    Ver Detalhes
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-sm font-medium transition-colors">
                    <FolderOpen className="w-4 h-4" />
                    Documentos
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-sm font-medium transition-colors">
                    <CreditCard className="w-4 h-4" />
                    Pagamentos
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// Componente Pagamentos
function PagamentosTab({ pagamentos }: { pagamentos: PagamentoPortal[] }) {
  const [filtro, setFiltro] = useState<
    "todos" | "pago" | "pendente" | "vencido"
  >("todos");

  const pagamentosFiltrados = pagamentos.filter((p) => {
    if (filtro === "todos") return true;
    return p.status === filtro;
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pago":
        return {
          label: "Pago",
          color: "bg-green-500/20 text-green-400 border-green-500/30",
          icon: CheckCircle,
        };
      case "pendente":
        return {
          label: "Pendente",
          color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
          icon: Clock,
        };
      case "vencido":
        return {
          label: "Vencido",
          color: "bg-red-500/20 text-red-400 border-red-500/30",
          icon: AlertTriangle,
        };
      default:
        return {
          label: status,
          color: "bg-neutral-500/20 text-neutral-400",
          icon: Clock,
        };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gradient-amber">
          Meus Pagamentos
        </h2>
        <div className="flex items-center gap-2">
          {["todos", "pendente", "pago", "vencido"].map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f as any)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                filtro === f
                  ? "bg-amber-500 text-neutral-950"
                  : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
              )}
            >
              {f === "todos" ? "Todos" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-neutral-900/95 backdrop-blur-xl p-4 rounded-xl border border-neutral-800">
          <p className="text-sm text-neutral-400">Total Pago</p>
          <p className="text-2xl font-bold text-green-400">
            {pagamentos
              .filter((p) => p.status === "pago")
              .reduce((acc, p) => acc + p.valor, 0)
              .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
        </div>
        <div className="bg-neutral-900/95 backdrop-blur-xl p-4 rounded-xl border border-neutral-800">
          <p className="text-sm text-neutral-400">Pendente</p>
          <p className="text-2xl font-bold text-amber-400">
            {pagamentos
              .filter((p) => p.status === "pendente")
              .reduce((acc, p) => acc + p.valor, 0)
              .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
        </div>
        <div className="bg-neutral-900/95 backdrop-blur-xl p-4 rounded-xl border border-neutral-800">
          <p className="text-sm text-neutral-400">Vencido</p>
          <p className="text-2xl font-bold text-red-400">
            {pagamentos
              .filter((p) => p.status === "vencido")
              .reduce((acc, p) => acc + p.valor, 0)
              .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
        </div>
      </div>

      {/* Lista de Pagamentos */}
      {pagamentosFiltrados.length === 0 ? (
        <div className="bg-neutral-900/95 backdrop-blur-xl rounded-xl border border-neutral-800 p-12 text-center">
          <CreditCard className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-300 mb-2">
            Nenhum pagamento encontrado
          </h3>
          <p className="text-neutral-500">
            {filtro === "todos"
              ? "Você ainda não possui pagamentos registrados."
              : `Nenhum pagamento com status "${filtro}".`}
          </p>
        </div>
      ) : (
        <div className="bg-neutral-900/95 backdrop-blur-xl rounded-xl border border-neutral-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-neutral-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-amber-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  Contrato
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  Vencimento
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  Pagamento
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {pagamentosFiltrados.map((pag) => {
                const statusConfig = getStatusConfig(pag.status);
                const StatusIcon = statusConfig.icon;
                const pagamentoComLink = pag as PagamentoPortal & {
                  linkBoleto?: string;
                  contratoNumero?: string;
                };
                return (
                  <tr
                    key={pag.id}
                    className="hover:bg-neutral-800/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="text-lg font-semibold text-neutral-100">
                        {pag.valor.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-neutral-300">
                      <span className="text-sm">
                        {pagamentoComLink.contratoNumero ||
                          `#${pag.contratoId}`}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-neutral-300">
                      {pag.dataVencimento
                        ? format(parseISO(pag.dataVencimento), "dd/MM/yyyy")
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-neutral-300">
                      {pag.dataPagamento
                        ? format(parseISO(pag.dataPagamento), "dd/MM/yyyy")
                        : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border w-fit",
                          statusConfig.color
                        )}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {(pag.status === "pendente" ||
                          pag.status === "vencido") &&
                          pagamentoComLink.linkBoleto && (
                            <a
                              href={pagamentoComLink.linkBoleto}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-neutral-950 text-xs font-medium rounded-lg transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Ver Boleto
                            </a>
                          )}
                        {pag.status === "pago" && (
                          <span className="text-xs text-green-400">
                            ✓ Quitado
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Componente Documentos
function DocumentosTab({ documentos }: { documentos: DocumentoPortal[] }) {
  const [searchTerm, setSearchTerm] = useState("");

  const documentosFiltrados = documentos.filter((doc) =>
    doc.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gradient-amber">
          Meus Documentos
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Buscar documento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-neutral-800/50 border border-neutral-700 rounded-lg text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documentosFiltrados.map((doc) => (
          <motion.div
            key={doc.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-neutral-900/95 backdrop-blur-xl p-4 rounded-xl border border-neutral-800 hover:border-amber-500/30 transition-all group cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <div className="p-3 bg-red-500/20 rounded-lg">
                <FileDown className="w-6 h-6 text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-neutral-100 truncate group-hover:text-amber-400 transition-colors">
                  {doc.nome}
                </h4>
                <p className="text-xs text-neutral-500 mt-1">
                  {doc.tipo} • {doc.tamanho}
                </p>
                <p className="text-xs text-neutral-500">
                  Enviado em {format(parseISO(doc.dataUpload), "dd/MM/yyyy")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-neutral-950 text-xs font-medium rounded-lg transition-colors">
                <Download className="w-3 h-3" />
                Baixar
              </button>
              <button className="flex items-center justify-center p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 rounded-lg transition-colors">
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Componente Chat/Mensagens
function MensagensTab({
  mensagens: initialMensagens,
}: {
  mensagens: MensagemChat[];
}) {
  const [mensagens, setMensagens] = useState(initialMensagens);
  const [novaMensagem, setNovaMensagem] = useState("");

  const handleEnviar = () => {
    if (!novaMensagem.trim()) return;

    const nova: MensagemChat = {
      id: mensagens.length + 1,
      remetente: "cliente",
      mensagem: novaMensagem,
      dataHora: new Date().toISOString(),
      lida: true,
    };

    setMensagens([...mensagens, nova]);
    setNovaMensagem("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gradient-amber">Mensagens</h2>
        <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full">
          Consultor Online
        </span>
      </div>

      {/* Área de Mensagens */}
      <div className="flex-1 bg-neutral-900/95 backdrop-blur-xl rounded-xl border border-neutral-800 overflow-hidden flex flex-col">
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {mensagens.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex",
                msg.remetente === "cliente" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[70%] px-4 py-3 rounded-2xl",
                  msg.remetente === "cliente"
                    ? "bg-amber-500 text-neutral-950 rounded-br-sm"
                    : "bg-neutral-800 text-neutral-100 rounded-bl-sm"
                )}
              >
                <p className="text-sm">{msg.mensagem}</p>
                <p
                  className={cn(
                    "text-xs mt-1",
                    msg.remetente === "cliente"
                      ? "text-neutral-700"
                      : "text-neutral-500"
                  )}
                >
                  {format(parseISO(msg.dataHora), "HH:mm")}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Input de Mensagem */}
        <div className="p-4 border-t border-neutral-800">
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-neutral-800 text-neutral-400 rounded-lg transition-colors">
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={novaMensagem}
              onChange={(e) => setNovaMensagem(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleEnviar()}
              placeholder="Digite sua mensagem..."
              className="flex-1 px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              onClick={handleEnviar}
              disabled={!novaMensagem.trim()}
              className="p-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-950 rounded-xl transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente Perfil
function PerfilTab({ cliente }: { cliente: ClienteAutenticado }) {
  const [editando, setEditando] = useState(false);

  // Extrair endereço do cliente
  const getEndereco = () => {
    if (cliente.tipoPessoa === "Fisica" && cliente.pessoaFisica?.endereco) {
      const e = cliente.pessoaFisica.endereco;
      return `${e.logradouro}, ${e.numero}${
        e.complemento ? ` - ${e.complemento}` : ""
      } - ${e.bairro}, ${e.cidade}/${e.estado}`;
    }
    if (cliente.tipoPessoa === "Juridica" && cliente.pessoaJuridica?.endereco) {
      const e = cliente.pessoaJuridica.endereco;
      return `${e.logradouro}, ${e.numero}${
        e.complemento ? ` - ${e.complemento}` : ""
      } - ${e.bairro}, ${e.cidade}/${e.estado}`;
    }
    return "Endereço não cadastrado";
  };

  const [dados, setDados] = useState({
    nome: cliente.nome,
    email: cliente.email,
    telefone: cliente.telefone || "",
    documento: cliente.documento,
    endereco: getEndereco(),
  });

  // Formatar data de cadastro
  const getDataCadastro = () => {
    try {
      return format(parseISO(cliente.dataCadastro), "MMM/yyyy", {
        locale: ptBR,
      });
    } catch {
      return "N/A";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gradient-amber">Meu Perfil</h2>
        <button
          onClick={() => setEditando(!editando)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            editando
              ? "bg-green-500 hover:bg-green-600 text-white"
              : "bg-amber-500 hover:bg-amber-600 text-neutral-950"
          )}
        >
          {editando ? (
            <>
              <Save className="w-4 h-4" />
              Salvar
            </>
          ) : (
            <>
              <Edit className="w-4 h-4" />
              Editar
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Foto e Info Básica */}
        <div className="bg-neutral-900/95 backdrop-blur-xl p-6 rounded-xl border border-neutral-800">
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center mb-4">
              {cliente.tipoPessoa === "Juridica" ? (
                <Building2 className="w-12 h-12 text-neutral-950" />
              ) : (
                <User className="w-12 h-12 text-neutral-950" />
              )}
            </div>
            <h3 className="text-xl font-bold text-neutral-100">{dados.nome}</h3>
            <p className="text-sm text-neutral-400">
              Cliente desde {getDataCadastro()}
            </p>
            <span className="mt-2 px-3 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full border border-amber-500/30">
              {cliente.tipoPessoa === "Juridica"
                ? "Pessoa Jurídica"
                : "Pessoa Física"}
            </span>
            <div className="mt-4 w-full space-y-2">
              <div className="flex items-center gap-2 text-sm text-neutral-300">
                <Mail className="w-4 h-4 text-amber-500" />
                <span className="truncate">
                  {dados.email || "Não informado"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-300">
                <Phone className="w-4 h-4 text-amber-500" />
                <span>{dados.telefone || "Não informado"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dados Cadastrais */}
        <div className="lg:col-span-2 bg-neutral-900/95 backdrop-blur-xl p-6 rounded-xl border border-neutral-800">
          <h3 className="text-lg font-semibold text-neutral-100 mb-6">
            Dados Cadastrais
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-neutral-400 mb-2">
                {cliente.tipoPessoa === "Juridica"
                  ? "Razão Social"
                  : "Nome Completo"}
              </label>
              <input
                type="text"
                value={dados.nome}
                onChange={(e) => setDados({ ...dados, nome: e.target.value })}
                disabled={!editando}
                className="w-full px-4 py-2.5 bg-neutral-800/50 border border-neutral-700 rounded-lg text-sm text-neutral-100 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-400 mb-2">
                {cliente.tipoPessoa === "Juridica" ? "CNPJ" : "CPF"}
              </label>
              <input
                type="text"
                value={dados.documento}
                disabled
                className="w-full px-4 py-2.5 bg-neutral-800/50 border border-neutral-700 rounded-lg text-sm text-neutral-100 opacity-60 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-400 mb-2">
                E-mail
              </label>
              <input
                type="email"
                value={dados.email}
                onChange={(e) => setDados({ ...dados, email: e.target.value })}
                disabled={!editando}
                className="w-full px-4 py-2.5 bg-neutral-800/50 border border-neutral-700 rounded-lg text-sm text-neutral-100 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-400 mb-2">
                Telefone
              </label>
              <input
                type="tel"
                value={dados.telefone}
                onChange={(e) =>
                  setDados({ ...dados, telefone: e.target.value })
                }
                disabled={!editando}
                className="w-full px-4 py-2.5 bg-neutral-800/50 border border-neutral-700 rounded-lg text-sm text-neutral-100 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-neutral-400 mb-2">
                Endereço
              </label>
              <input
                type="text"
                value={dados.endereco}
                onChange={(e) =>
                  setDados({ ...dados, endereco: e.target.value })
                }
                disabled={!editando}
                className="w-full px-4 py-2.5 bg-neutral-800/50 border border-neutral-700 rounded-lg text-sm text-neutral-100 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Informações Adicionais */}
      <div className="bg-neutral-900/95 backdrop-blur-xl p-6 rounded-xl border border-neutral-800">
        <h3 className="text-lg font-semibold text-neutral-100 mb-6">
          Informações do Cadastro
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-neutral-800/50 p-4 rounded-lg">
            <p className="text-xs text-neutral-500 mb-1">Código do Cliente</p>
            <p className="text-lg font-semibold text-neutral-100">
              #{cliente.id}
            </p>
          </div>
          <div className="bg-neutral-800/50 p-4 rounded-lg">
            <p className="text-xs text-neutral-500 mb-1">Tipo de Cadastro</p>
            <p className="text-lg font-semibold text-neutral-100">
              {cliente.tipoPessoa === "Juridica"
                ? "Pessoa Jurídica"
                : "Pessoa Física"}
            </p>
          </div>
          <div className="bg-neutral-800/50 p-4 rounded-lg">
            <p className="text-xs text-neutral-500 mb-1">Cliente desde</p>
            <p className="text-lg font-semibold text-neutral-100">
              {getDataCadastro()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Página Principal do Portal
export default function PortalClientePage() {
  const router = useRouter();
  const {
    cliente,
    isAuthenticated,
    isLoading: authLoading,
    logout,
  } = useClienteAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mounted, setMounted] = useState(false);

  // Hook para buscar dados reais do cliente
  const {
    data: portalData,
    isLoading: dataLoading,
    error: dataError,
    refetch,
  } = usePortalClienteData(cliente?.id || null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (mounted && !authLoading && !isAuthenticated) {
      router.push("/portal-cliente/login");
    }
  }, [mounted, authLoading, isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.push("/portal-cliente/login");
  };

  const mensagensNaoLidas = mockMensagens.filter(
    (m) => !m.lida && m.remetente === "consultor"
  ).length;

  // Loading state
  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-4" />
          <p className="text-neutral-400">Carregando...</p>
        </div>
      </div>
    );
  }

  // Não autenticado - redireciona (ou mostra loading enquanto redireciona)
  if (!isAuthenticated || !cliente) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  // Dados do portal (usa dados reais ou arrays vazios)
  const contratos = portalData?.contratos || [];
  const pagamentos = portalData?.pagamentos || [];
  const resumo = portalData?.resumo;

  const renderContent = () => {
    // Loading de dados
    if (dataLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-4" />
            <p className="text-neutral-400">Carregando seus dados...</p>
          </div>
        </div>
      );
    }

    // Erro ao carregar dados
    if (dataError) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center bg-neutral-900/95 backdrop-blur-xl p-8 rounded-xl border border-red-500/30">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-100 mb-2">
              Erro ao carregar dados
            </h3>
            <p className="text-neutral-400 mb-4">{dataError}</p>
            <button
              onClick={refetch}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-neutral-950 rounded-lg font-medium transition-colors mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar novamente
            </button>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardTab
            contratos={contratos}
            pagamentos={pagamentos}
            resumo={resumo}
          />
        );
      case "contratos":
        return <ContratosTab contratos={contratos} />;
      case "pagamentos":
        return <PagamentosTab pagamentos={pagamentos} />;
      case "documentos":
        return <DocumentosTab documentos={mockDocumentos} />;
      case "mensagens":
        return <MensagensTab mensagens={mockMensagens} />;
      case "perfil":
        return <PerfilTab cliente={cliente} />;
      default:
        return (
          <DashboardTab
            contratos={contratos}
            pagamentos={pagamentos}
            resumo={resumo}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 flex">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        notificacoes={mensagensNaoLidas}
        cliente={cliente}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Botão Voltar para Dashboard */}
              <button
                onClick={() => router.push("/dashboard")}
                className="flex items-center gap-2 px-3 py-2 bg-neutral-800/50 hover:bg-neutral-700/50 border border-neutral-700 hover:border-amber-500/30 text-neutral-300 hover:text-amber-400 rounded-lg transition-all group"
                title="Voltar ao Dashboard"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-sm font-medium">Dashboard</span>
              </button>
              <div className="h-8 w-px bg-neutral-700" />
              <div>
                <h1 className="text-xl font-semibold text-neutral-100">
                  {activeTab === "dashboard" && "Visão Geral"}
                  {activeTab === "contratos" && "Meus Contratos"}
                  {activeTab === "pagamentos" && "Pagamentos"}
                  {activeTab === "documentos" && "Documentos"}
                  {activeTab === "mensagens" && "Mensagens"}
                  {activeTab === "perfil" && "Meu Perfil"}
                </h1>
                <p className="text-sm text-neutral-500">
                  Olá, {cliente.nome.split(" ")[0]}! Bem-vindo(a) ao seu portal
                  exclusivo
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 hover:bg-neutral-800 rounded-lg transition-colors">
                <Bell className="w-5 h-5 text-neutral-400" />
                {mensagensNaoLidas > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {mensagensNaoLidas}
                  </span>
                )}
              </button>
              <button className="p-2 hover:bg-neutral-800 rounded-lg transition-colors">
                <HelpCircle className="w-5 h-5 text-neutral-400" />
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center">
                {cliente.tipoPessoa === "Juridica" ? (
                  <Building2 className="w-5 h-5 text-neutral-950" />
                ) : (
                  <User className="w-5 h-5 text-neutral-950" />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
