"use client";
import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Building2,
  Bell,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Menu,
  Home,
  BarChart3,
  Settings,
  LogOut,
  Activity,
  DollarSign,
  Target,
  Search,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  XCircle,
  ChevronRight,
  Download,
  Moon,
  Shield,
  Sparkles,
  Sun,
  Upload,
  X,
  Calendar,
  FileCheck,
  CreditCard,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { useAtividadeContext } from "@/contexts/AtividadeContext";
import { formatRelativeTime } from "@/lib/formatUtils";
import { useClientes } from "@/hooks/useClientes";
import { useSessoesAtivas } from "@/hooks/useSessoesAtivas";
import { useEstatisticas } from "@/hooks/useEstatisticas";
import { useRiscoInadimplencia } from "@/hooks/useRiscoInadimplencia";
import { useAuth } from "@/contexts/AuthContext";
import { SessoesAtivasModal } from "./SessoesAtivasModal";
import { RiscoInadimplenciaModal } from "./RiscoInadimplenciaModal";
import { UltimosBoletosPagos } from "./UltimosBoletosPagos";
import { useNotificacoes } from "@/hooks/useNotificacoes";

// Componente de Card Moderno com Glassmorphism - Otimizado com memo
const GlassCard = memo(
  ({
    children,
    className = "",
    delay = 0,
    onClick,
  }: {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    onClick?: () => void;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20, rotateX: -10 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{
        duration: 0.6,
        delay,
        type: "spring",
        stiffness: 100,
      }}
      whileHover={{
        y: -5,
        scale: 1.02,
        transition: { duration: 0.2 },
      }}
      className={`
      relative backdrop-blur-xl bg-white/10
      border border-white/20
      rounded-3xl p-6 shadow-2xl
      before:absolute before:inset-0 before:rounded-3xl
      before:bg-gradient-to-br before:from-white/10 before:to-transparent
      before:pointer-events-none
      hover:shadow-[0_20px_70px_-15px_rgba(0,0,0,0.3)]
      ${className}
    `}
      onClick={onClick}
      style={{
        transformStyle: "preserve-3d",
        transform: "perspective(1000px)",
      }}
    >
      {children}
    </motion.div>
  )
);
GlassCard.displayName = "GlassCard";

// Componente de Estatística Animada - Otimizado com memo
const AnimatedStat = memo(
  ({
    value,
    suffix = "",
    prefix = "",
    decimals = 0,
  }: {
    value: number;
    suffix?: string;
    prefix?: string;
    decimals?: number;
  }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
      const duration = 2000;
      const steps = 60;
      const stepValue = value / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += stepValue;
        if (current >= value) {
          setDisplayValue(value);
          clearInterval(timer);
        } else {
          setDisplayValue(current);
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }, [value]);

    // Formatação para valores monetários (quando há prefix "R$ ")
    const formatValue = (val: number) => {
      if (prefix === "R$ ") {
        // Formatação monetária brasileira
        return val.toLocaleString("pt-BR", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        });
      }
      // Formatação padrão com separadores de milhares
      return val.toLocaleString("pt-BR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    };

    return (
      <span className="tabular-nums">
        {prefix}
        {formatValue(displayValue)}
        {suffix}
      </span>
    );
  }
);
AnimatedStat.displayName = "AnimatedStat";

// Componente de Gráfico Circular Animado - Otimizado com memo
const CircularProgress = memo(
  ({
    percentage,
    color,
    size = 120,
  }: {
    percentage: number;
    color: string;
    size?: number;
  }) => {
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-gray-200"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {percentage}%
          </span>
        </div>
      </div>
    );
  }
);
CircularProgress.displayName = "CircularProgress";

// Componente de Notificação - Otimizado com memo
const NotificationBadge = memo(({ count }: { count: number }) => (
  <motion.div
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    transition={{ type: "spring", stiffness: 500 }}
    className="absolute -top-2 -right-2 min-w-[24px] h-6 px-1.5
               bg-gradient-to-r from-red-500 to-pink-500
               rounded-full flex items-center justify-center
               text-white text-xs font-bold
               shadow-lg shadow-red-500/50"
  >
    {count > 99 ? "99+" : count}
  </motion.div>
));
NotificationBadge.displayName = "NotificationBadge";

// Componente Principal do Dashboard - Otimizado
export default function ModernDashboard() {
  const { user, permissoes } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("week");
  const [refreshing, setRefreshing] = useState(false);
  const [sessoesModalOpen, setSessoesModalOpen] = useState(false);
  const [riscoModalOpen, setRiscoModalOpen] = useState(false);

  // Contexto de atividades
  const { obterAtividadesRecentes } = useAtividadeContext();

  // Hook para dados de clientes
  const { clientes, loading: clientesLoading } = useClientes();

  // Hook para sessões ativas em tempo real (incluindo histórico de todos os usuários)
  // Apenas buscar se for administrador - não buscar nada se não for admin
  const isAdmin = permissoes?.grupo === "Administrador";
  // Usar endpoint de histórico para mostrar todos os usuários (online e offline)
  const {
    sessoes,
    count: sessoesCount,
    countOnline: sessoesOnline,
    loading: sessoesLoading,
  } = useSessoesAtivas(true);

  // Hook para estatísticas e receita
  const {
    receita,
    dashboard,
    loading: estatisticasLoading,
    error: estatisticasError,
    refreshData: refreshEstatisticas,
  } = useEstatisticas();

  // Hook para análise de risco de inadimplência
  const { resumo: resumoRisco, loading: riscoLoading } =
    useRiscoInadimplencia();

  // Hook para notificações
  const { countNaoLidas, loading: notificacoesLoading } = useNotificacoes();

  // Atualizar receita automaticamente a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      refreshEstatisticas();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [refreshEstatisticas]);

  // Contagem de clientes ativos
  // O backend já retorna apenas clientes com Ativo = true (soft delete filter)
  // Então todos os clientes retornados são clientes ativos no sistema
  const clientesAtivos = clientes.length;

  // Debug: verificar dados de receita
  useEffect(() => {
    console.log("🔍 Dashboard: receita object =", receita);
    console.log("🔍 Dashboard: receita?.receitaTotal =", receita?.receitaTotal);
  }, [receita]);

  // Dados reais calculados - Memoizados para performance
  const stats = useMemo(
    () => ({
      clientesAtivos: clientesAtivos,
      novosClientes: Math.max(
        0,
        clientesAtivos - Math.floor(clientesAtivos * 0.9)
      ), // Estimativa de novos clientes
      revenue: receita?.receitaTotal || 0,
      revenueGrowth: receita?.crescimentoMes || 0,
      // Sessões ativas apenas para administradores
      activeSessions: isAdmin ? sessoesOnline : 0,
      conversionRate: receita?.taxaConversao || 0,
      totalOrders: dashboard?.Contratos?.TotalContratos || 0,
      orderGrowth: receita?.contratosMesAtual || 0,
      // Novos campos baseados em dados reais
      receitaMesAtual: receita?.receitaMesAtual || 0,
      receitaAnoAtual: receita?.receitaAnoAtual || 0,
      contratosFechados: receita?.contratosFechados || 0,
      valorBoletosLiquidados: receita?.valorBoletosLiquidados || 0,
      valorBoletosPendentes: receita?.valorBoletosPendentes || 0,
      comissaoTotal: receita?.comissaoTotal || 0,
    }),
    [clientesAtivos, sessoesOnline, receita, dashboard, isAdmin]
  );

  const chartData = useMemo(
    () => [
      { day: "Seg", value: 42 },
      { day: "Ter", value: 65 },
      { day: "Qua", value: 58 },
      { day: "Qui", value: 72 },
      { day: "Sex", value: 89 },
      { day: "Sáb", value: 95 },
      { day: "Dom", value: 78 },
    ],
    []
  );

  // Obter atividades recentes dinâmicas - Memoizadas
  const atividadesRecentes = useMemo(
    () => obterAtividadesRecentes(6),
    [obterAtividadesRecentes]
  );

  // Função de refresh memoizada
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshEstatisticas();
    } catch (error) {
      console.error("Erro ao atualizar estatísticas:", error);
    } finally {
      setTimeout(() => setRefreshing(false), 2000);
    }
  }, [refreshEstatisticas]);

  return (
    <div className="min-h-screen bg-neutral-950">
      <div
        className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950
                       transition-all duration-500"
      >
        {/* Background Futurista com Efeitos Dourados */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(212,175,55,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

          {/* Glow Effects */}
          <div
            className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10
                       rounded-full blur-3xl opacity-30 animate-pulse"
            style={{ animationDuration: "4s" }}
          />
          <div
            className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-600/10
                       rounded-full blur-3xl opacity-20 animate-pulse"
            style={{ animationDuration: "6s", animationDelay: "2s" }}
          />

          {/* Accent Lines */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
        </div>

        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ x: -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed left-0 top-[68px] h-[calc(100vh-68px)] w-72 z-40"
            >
              <GlassCard className="h-full rounded-none rounded-r-3xl bg-neutral-900/95 border-neutral-800">
                <div className="flex items-center justify-between mb-8">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center space-x-3"
                  >
                    <div
                      className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600
                                    rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20
                                    border border-amber-500/20"
                    >
                      <Sparkles className="w-7 h-7 text-neutral-950" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-gradient-amber">
                        CRM JURÍDICO
                      </h1>
                      <p className="text-xs text-neutral-400">
                        Enterprise Platform
                      </p>
                    </div>
                  </motion.div>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="lg:hidden p-2 hover:bg-neutral-800 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-neutral-400" />
                  </button>
                </div>

                {/* Menu Items */}
                <nav className="space-y-2">
                  {[{ icon: Home, label: "Dashboard", active: true }].map(
                    (item) => (
                      <motion.button
                        key={item.label}
                        whileHover={{ x: 5 }}
                        whileTap={{ scale: 0.95 }}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl
                                  transition-all duration-300 group
                                  ${
                                    item.active
                                      ? "bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/30"
                                      : "hover:bg-neutral-800/50"
                                  }`}
                      >
                        <div className="flex items-center space-x-3">
                          <item.icon
                            className={`w-5 h-5 ${
                              item.active
                                ? "text-amber-400"
                                : "text-neutral-400"
                            }`}
                          />
                          <span
                            className={`font-medium ${
                              item.active
                                ? "text-neutral-50"
                                : "text-neutral-400"
                            }`}
                          >
                            {item.label}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </motion.button>
                    )
                  )}
                </nav>

                {/* User Profile */}
                <div className="absolute bottom-6 left-6 right-6">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center space-x-3 p-3 bg-neutral-800/50 rounded-2xl border border-amber-500/20"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/20">
                      <span className="text-neutral-950 font-bold text-sm">
                        {user?.nome ? user.nome.charAt(0).toUpperCase() : "U"}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-neutral-50">
                        {user?.nome || "Usuário"}
                      </p>
                      <p className="text-xs text-neutral-400">
                        {user?.email || "usuario@email.com"}
                      </p>
                    </div>
                    <LogOut className="w-5 h-5 text-neutral-400 hover:text-amber-400 transition-colors" />
                  </motion.div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div
          className={`transition-all duration-300 ${
            sidebarOpen ? "lg:ml-72" : ""
          }`}
        >
          {/* Top Bar */}
          <GlassCard className="mx-6 mt-6 rounded-3xl bg-neutral-900/95 border-neutral-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 hover:bg-neutral-800 rounded-xl transition-colors"
                >
                  <Menu className="w-6 h-6 text-neutral-300" />
                </button>

                <div
                  className="hidden md:flex items-center space-x-2 px-4 py-2 bg-neutral-800/50
                                rounded-2xl backdrop-blur-sm border border-neutral-700"
                >
                  <Search className="w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Pesquisar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none outline-none text-neutral-200
                               placeholder-neutral-500 w-64"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleRefresh}
                  className="p-3 hover:bg-neutral-800 rounded-xl transition-colors"
                >
                  <RefreshCw
                    className={`w-5 h-5 text-neutral-300
                                        ${
                                          refreshing
                                            ? "animate-spin text-amber-400"
                                            : ""
                                        }`}
                  />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="relative p-3 hover:bg-neutral-800 rounded-xl transition-colors"
                >
                  <Bell className="w-5 h-5 text-neutral-300" />
                  {!notificacoesLoading && countNaoLidas > 0 && (
                    <NotificationBadge count={countNaoLidas} />
                  )}
                </motion.button>
              </div>
            </div>
          </GlassCard>

          {/* Header com Título */}
          <div className="px-6 mt-8 mb-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-2">
                <span className="text-gradient-amber">
                  Bem-vindo de volta! 👋
                </span>
              </h1>
              <p className="text-neutral-400 text-lg">
                Aqui está o que está acontecendo com seu negócio hoje
              </p>
              {user?.ultimoAcessoAnterior && (
                <p className="text-neutral-500 text-sm mt-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Último acesso:{" "}
                  {(() => {
                    try {
                      let dateStr = user.ultimoAcessoAnterior;
                      // Adicionar timezone se não tiver
                      if (!dateStr.includes('Z') && !dateStr.match(/[+-]\d{2}:\d{2}$/)) {
                        dateStr = dateStr + '-03:00';
                      }
                      const date = new Date(dateStr);
                      if (isNaN(date.getTime())) return "Data inválida";
                      return date.toLocaleString("pt-BR", {
                        timeZone: "America/Sao_Paulo",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                    } catch {
                      return "Data inválida";
                    }
                  })()}
                </p>
              )}
            </motion.div>
          </div>

          {/* Stats Grid */}
          <div className="px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              {
                title: "Clientes Ativos",
                value: clientesLoading ? 0 : stats.clientesAtivos || 0,
                change: `+${stats.novosClientes || 0}`,
                changeType: "positive",
                icon: Users,
                color: "from-blue-500 to-cyan-500",
                bgColor: "from-blue-500/20 to-cyan-500/20",
                loading: clientesLoading,
              },
              {
                title: "Receita Total",
                value: estatisticasLoading ? 0 : stats.revenue,
                change: `${stats.revenueGrowth > 0 ? "+" : ""}${
                  stats.revenueGrowth
                }%`,
                changeType: stats.revenueGrowth >= 0 ? "positive" : "negative",
                icon: DollarSign,
                color: "from-green-500 to-emerald-500",
                bgColor: "from-green-500/20 to-emerald-500/20",
                prefix: "R$ ",
                loading: estatisticasLoading,
              },
              // Sessões Ativas - APENAS para administradores
              // Taxa de Conversão - para todos os outros grupos
              ...(isAdmin
                ? [
                    {
                      title: "Sessões Ativas",
                      value: stats.activeSessions,
                      change: "Em tempo real",
                      changeType: "neutral" as const,
                      icon: Activity,
                      color: "from-purple-500 to-pink-500",
                      bgColor: "from-purple-500/20 to-pink-500/20",
                      clickable: true,
                      onClick: () => setSessoesModalOpen(true),
                    },
                  ]
                : [
                    {
                      title: "Taxa de Conversão",
                      value: estatisticasLoading ? 0 : stats.conversionRate,
                      change: `${stats.conversionRate > 0 ? "+" : ""}${
                        stats.conversionRate
                      }%`,
                      changeType:
                        stats.conversionRate >= 0 ? "positive" : "negative",
                      icon: Target,
                      color: "from-orange-500 to-red-500",
                      bgColor: "from-orange-500/20 to-red-500/20",
                      suffix: "%",
                      loading: estatisticasLoading,
                    },
                  ]),
              {
                title: "Receita do Mês",
                value: estatisticasLoading ? 0 : stats.receitaMesAtual,
                change: `Mês atual`,
                changeType: "neutral",
                icon: Calendar,
                color: "from-blue-500 to-indigo-500",
                bgColor: "from-blue-500/20 to-indigo-500/20",
                prefix: "R$ ",
                loading: estatisticasLoading,
              },
              {
                title: "Contratos Fechados",
                value: estatisticasLoading ? 0 : stats.contratosFechados,
                change: `Total: ${stats.totalOrders}`,
                changeType: "positive",
                icon: FileCheck,
                color: "from-emerald-500 to-teal-500",
                bgColor: "from-emerald-500/20 to-teal-500/20",
                loading: estatisticasLoading,
              },
              {
                title: "Boletos Liquidados",
                value: estatisticasLoading ? 0 : stats.valorBoletosLiquidados,
                change: `Cancelados: R$ ${stats.valorBoletosPendentes.toLocaleString()}`,
                changeType: "positive",
                icon: CreditCard,
                color: "from-green-500 to-lime-500",
                bgColor: "from-green-500/20 to-lime-500/20",
                prefix: "R$ ",
                loading: estatisticasLoading,
              },
              {
                title: "Risco Inadimplência",
                value: riscoLoading ? 0 : resumoRisco?.clientesAltoRisco || 0,
                change: riscoLoading
                  ? "Carregando..."
                  : `${resumoRisco?.clientesMedioRisco || 0} médio risco`,
                changeType:
                  (resumoRisco?.clientesAltoRisco || 0) > 0
                    ? "negative"
                    : "positive",
                icon: AlertTriangle,
                color: "from-red-500 to-orange-500",
                bgColor: "from-red-500/20 to-orange-500/20",
                loading: riscoLoading,
                clickable: true,
                onClick: () => setRiscoModalOpen(true),
              },
            ].map((stat, index) => (
              <GlassCard
                key={stat.title}
                delay={index * 0.1}
                className={
                  stat.clickable
                    ? "cursor-pointer hover:scale-105 transition-transform bg-neutral-900/95 border-neutral-800"
                    : "bg-neutral-900/95 border-neutral-800"
                }
                onClick={stat.onClick}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/30`}
                  >
                    <stat.icon className="w-6 h-6 text-amber-400" />
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-semibold
                                ${
                                  stat.changeType === "positive"
                                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                    : stat.changeType === "negative"
                                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                    : "bg-neutral-700/50 text-neutral-300 border border-neutral-600"
                                }`}
                  >
                    {stat.changeType === "positive" && (
                      <ArrowUpRight className="w-3 h-3" />
                    )}
                    {stat.changeType === "negative" && (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    <span>{stat.change}</span>
                  </motion.div>
                </div>
                <p className="text-neutral-400 text-sm mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-neutral-50">
                  {stat.loading ? (
                    <span className="animate-pulse text-amber-400">...</span>
                  ) : (
                    <AnimatedStat
                      value={stat.value}
                      prefix={stat.prefix}
                      suffix={stat.suffix}
                      decimals={stat.suffix === "%" ? 2 : 0}
                    />
                  )}
                </p>
              </GlassCard>
            ))}
          </div>

          {/* Charts Section */}
          <div className="px-6 grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Main Chart */}
            <div className="lg:col-span-2">
              <GlassCard
                delay={0.4}
                className="bg-neutral-900/95 border-neutral-800"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-neutral-50 mb-1">
                      Visão Geral de Vendas
                    </h3>
                    <p className="text-sm text-neutral-400">Últimos 7 dias</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {["dia", "semana", "mês"].map((period) => (
                      <motion.button
                        key={period}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedPeriod(period)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
                                    ${
                                      selectedPeriod === period
                                        ? "bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 shadow-lg shadow-amber-500/20"
                                        : "bg-neutral-800/50 text-neutral-400 hover:bg-neutral-800 border border-neutral-700"
                                    }`}
                      >
                        {period.charAt(0).toUpperCase() + period.slice(1)}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Animated Bar Chart */}
                <div className="flex items-end justify-between h-64 px-2">
                  {chartData.map((item, index) => (
                    <motion.div
                      key={item.day}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: `${item.value}%`, opacity: 1 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      whileHover={{ scaleY: 1.05 }}
                      className="relative flex-1 mx-1 bg-gradient-to-t from-amber-600 to-amber-400
                                 rounded-t-2xl cursor-pointer group shadow-lg shadow-amber-500/20"
                    >
                      <motion.div
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        className="absolute -top-8 left-1/2 transform -translate-x-1/2
                                   bg-neutral-800 text-amber-400 text-xs px-2 py-1 rounded-lg border border-amber-500/30"
                      >
                        {item.value}%
                      </motion.div>
                      <span
                        className="absolute -bottom-6 left-0 right-0 text-center text-xs
                                       text-neutral-400"
                      >
                        {item.day}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </GlassCard>
            </div>

            {/* Progress Cards */}
            <div className="space-y-6">
              <GlassCard delay={0.5}>
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Metas do Mês
                </h3>
                <div className="flex items-center justify-center mb-4">
                  <CircularProgress percentage={68} color="#3B82F6" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Vendas</span>
                    <span className="text-sm font-bold text-gray-900">
                      R$ 32.5k / 50k
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Novos Clientes
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      142 / 200
                    </span>
                  </div>
                </div>
              </GlassCard>

              <GlassCard delay={0.6}>
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Performance
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      label: "Produtividade",
                      value: 87,
                      color: "from-green-400 to-green-600",
                    },
                    {
                      label: "Qualidade",
                      value: 92,
                      color: "from-blue-400 to-blue-600",
                    },
                    {
                      label: "Satisfação",
                      value: 78,
                      color: "from-purple-400 to-purple-600",
                    },
                  ].map((metric, index) => (
                    <div key={metric.label}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600">
                          {metric.label}
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          {metric.value}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${metric.value}%` }}
                          transition={{ duration: 1, delay: 0.7 + index * 0.1 }}
                          className={`h-full bg-gradient-to-r ${metric.color} rounded-full`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          </div>

          {/* Últimos Boletos Pagos */}
          <div className="px-6 mb-8">
            <UltimosBoletosPagos />
          </div>

          {/* Activity Feed & Quick Actions */}
          <div className="px-6 grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Activity Feed */}
            <div className="lg:col-span-2">
              <GlassCard delay={0.7}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    Atividade Recente
                  </h3>
                </div>
                <div className="space-y-4">
                  {atividadesRecentes.length === 0 ? (
                    <div className="text-center py-8">
                      <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Nenhuma atividade recente</p>
                      <p className="text-xs text-gray-400 mt-1">
                        As atividades aparecerão aqui conforme você usa o
                        sistema
                      </p>
                    </div>
                  ) : (
                    atividadesRecentes.map((atividade, index) => (
                      <motion.div
                        key={atividade.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
                        whileHover={{ x: 5 }}
                        className="flex items-center space-x-4 p-3 rounded-2xl hover:bg-white/20
                                   transition-all cursor-pointer"
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center
                                        ${
                                          atividade.tipo === "success"
                                            ? "bg-green-100"
                                            : atividade.tipo === "warning"
                                            ? "bg-amber-100"
                                            : atividade.tipo === "error"
                                            ? "bg-red-100"
                                            : "bg-blue-100"
                                        }`}
                        >
                          {atividade.tipo === "success" && (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          )}
                          {atividade.tipo === "warning" && (
                            <AlertCircle className="w-5 h-5 text-amber-600" />
                          )}
                          {atividade.tipo === "error" && (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                          {atividade.tipo === "info" && (
                            <Activity className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            <span className="font-bold">
                              {atividade.usuario}
                            </span>{" "}
                            {atividade.acao}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatRelativeTime(atividade.timestamp)}
                          </p>
                          {atividade.moduloOrigem && (
                            <p className="text-xs text-gray-400">
                              via {atividade.moduloOrigem}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </motion.div>
                    ))
                  )}
                </div>
              </GlassCard>
            </div>

            {/* Quick Actions */}
            <GlassCard delay={0.9}>
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Ações Rápidas
              </h3>
              <div className="space-y-3">
                {[
                  {
                    icon: Plus,
                    label: "Novo Cliente",
                    color: "from-blue-500 to-cyan-500",
                  },
                  {
                    icon: Upload,
                    label: "Upload Arquivo",
                    color: "from-green-500 to-emerald-500",
                  },
                  {
                    icon: Download,
                    label: "Exportar Relatório",
                    color: "from-purple-500 to-pink-500",
                  },
                  {
                    icon: Shield,
                    label: "Configurar Segurança",
                    color: "from-orange-500 to-red-500",
                  },
                ].map((action, index) => (
                  <motion.button
                    key={action.label}
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 1 + index * 0.1 }}
                    className="w-full flex items-center space-x-3 p-3 rounded-2xl
                               bg-white/10 hover:bg-white/20
                               transition-all group"
                  >
                    <div
                      className={`p-2 rounded-xl bg-gradient-to-r ${action.color}
                                     shadow-lg group-hover:shadow-xl transition-shadow`}
                    >
                      <action.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {action.label}
                    </span>
                    <ChevronRight
                      className="w-4 h-4 text-gray-400 ml-auto
                                           group-hover:translate-x-1 transition-transform"
                    />
                  </motion.button>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* Modal de Sessões Ativas - apenas para administradores */}
      {permissoes?.grupo === "Administrador" && (
        <SessoesAtivasModal
          isOpen={sessoesModalOpen}
          onClose={() => setSessoesModalOpen(false)}
          sessoes={sessoes}
          loading={sessoesLoading}
          countOnline={sessoesOnline}
        />
      )}

      {/* Modal de Análise de Risco de Inadimplência */}
      <RiscoInadimplenciaModal
        isOpen={riscoModalOpen}
        onClose={() => setRiscoModalOpen(false)}
      />
    </div>
  );
}
