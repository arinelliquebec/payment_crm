// src/app/dashboard/financeiro/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBoletos } from "@/hooks/useBoletos";
import { DashboardFinanceiro } from "@/types/boleto";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Calendar,
  Activity,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Receipt,
  Target,
  Award,
  Sparkles,
  ChartBar,
} from "lucide-react";
import MainLayout from "@/components/MainLayout";

export default function DashboardFinanceiroPage() {
  const { dashboard, loading, error, fetchDashboard, clearError } =
    useBoletos();
  const [stats, setStats] = useState<DashboardFinanceiro | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    setStats(dashboard);
  }, [dashboard]);

  const loadDashboard = async () => {
    setRefreshing(true);
    try {
      await fetchDashboard();
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatPercentage = (value: number, total: number) => {
    if (!total) return "0%";
    return `${Math.round((value / total) * 100)}%`;
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    gradient,
    subtitle,
    trend,
    delay = 0,
  }: {
    title: string;
    value: string | number;
    icon: any;
    gradient: string;
    subtitle?: string;
    trend?: { value: number; isUp: boolean };
    delay?: number;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="relative group"
    >
      <div
        className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 -z-10"
        style={{
          background: gradient,
        }}
      />
      <div className="bg-neutral-900/95 backdrop-blur-xl rounded-2xl border border-neutral-800 hover:border-amber-500/30 shadow-xl p-6 h-full transition-all">
        <div className="flex items-start justify-between mb-4">
          <div
            className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}
          >
            <Icon className="w-6 h-6 text-white drop-shadow-lg" />
          </div>
          {trend && (
            <div
              className={`flex items-center gap-1 text-sm font-medium ${
                trend.isUp ? "text-green-400" : "text-red-400"
              }`}
            >
              {trend.isUp ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
              {trend.value}%
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-neutral-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-neutral-50">{value}</p>
          {subtitle && (
            <p className="text-xs text-neutral-500 mt-2">{subtitle}</p>
          )}
        </div>
      </div>
    </motion.div>
  );

  const StatusCard = ({
    title,
    value,
    icon: Icon,
    color,
    bgColor,
    delay = 0,
  }: {
    title: string;
    value: number;
    icon: any;
    color: string;
    bgColor: string;
    delay?: number;
  }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ scale: 1.05 }}
      className="relative group cursor-pointer"
    >
      <div
        className={`absolute inset-0 ${bgColor} opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500 rounded-2xl`}
      />
      <div className="bg-neutral-800/50 backdrop-blur-xl rounded-2xl p-4 border border-neutral-700 hover:border-amber-500/30 transition-all duration-300">
        <div className="flex flex-col items-center">
          <div
            className={`w-14 h-14 ${bgColor}/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 border border-${bgColor.replace(
              "bg-",
              ""
            )}/30`}
          >
            <Icon className={`w-7 h-7 ${color}`} />
          </div>
          <p className="text-2xl font-bold text-neutral-100">{value}</p>
          <p className="text-sm text-neutral-400 mt-1">{title}</p>
        </div>
      </div>
    </motion.div>
  );

  if (loading && !stats) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="relative">
              <RefreshCw className="w-12 h-12 animate-spin text-amber-400 mx-auto" />
              <div className="absolute inset-0 blur-xl bg-amber-400/30 animate-pulse" />
            </div>
            <p className="mt-4 text-neutral-400 font-medium">
              Carregando dashboard financeiro...
            </p>
          </motion.div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
          <div className="container mx-auto px-4 py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 mb-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                  <p className="text-red-300 font-medium">{error}</p>
                </div>
                <button
                  onClick={clearError}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/20 p-1 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
            <button
              onClick={loadDashboard}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
        <div className="container mx-auto px-4 py-8">
          {/* Header com gradiente e animação */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-10"
          >
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg shadow-amber-500/30">
                  <ChartBar className="w-8 h-8 text-neutral-950" />
                </div>
                <h1 className="text-4xl font-bold text-gradient-amber">
                  Dashboard Financeiro
                </h1>
                <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
              </div>
              <p className="text-neutral-400 ml-14">
                Visão geral dos boletos e movimentações financeiras em tempo
                real
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={loadDashboard}
              disabled={refreshing}
              className="group flex items-center gap-2 px-5 py-3 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-amber-500/30 rounded-xl transition-all duration-300"
            >
              <RefreshCw
                className={`w-5 h-5 text-neutral-400 group-hover:text-amber-400 transition-colors ${
                  refreshing ? "animate-spin" : ""
                }`}
              />
              <span className="font-medium text-neutral-300 group-hover:text-neutral-100">
                {refreshing ? "Atualizando..." : "Atualizar"}
              </span>
            </motion.button>
          </motion.div>

          {/* Cards principais com gradientes e animações */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <StatCard
              title="Total de Boletos"
              value={stats?.totalBoletos || 0}
              icon={FileText}
              gradient="from-blue-500 to-blue-600"
              subtitle="Todos os boletos do sistema"
              trend={{ value: 12, isUp: true }}
              delay={0}
            />

            <StatCard
              title="Valor Registrado"
              value={formatCurrency(stats?.valorTotalRegistrado || 0)}
              icon={Wallet}
              gradient="from-emerald-500 to-green-600"
              subtitle="Boletos no Santander"
              trend={{ value: 8, isUp: true }}
              delay={0.1}
            />

            <StatCard
              title="Valor Liquidado"
              value={formatCurrency(stats?.valorTotalLiquidado || 0)}
              icon={CheckCircle}
              gradient="from-purple-500 to-pink-600"
              subtitle="Pagos pelos clientes"
              trend={{ value: 15, isUp: true }}
              delay={0.2}
            />

            <StatCard
              title="Boletos Hoje"
              value={stats?.boletosHoje || 0}
              icon={Calendar}
              gradient="from-orange-500 to-red-600"
              subtitle="Criados nas últimas 24h"
              delay={0.3}
            />
          </div>

          {/* Grid de Status com hover effects */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-neutral-900/95 backdrop-blur-xl rounded-3xl border border-neutral-800 shadow-xl p-8 mb-10"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Activity className="w-6 h-6 text-amber-400" />
                <h2 className="text-2xl font-bold text-neutral-100">
                  Status dos Boletos
                </h2>
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <Clock className="w-4 h-4" />
                Atualizado em tempo real
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatusCard
                title="Pendentes"
                value={stats?.boletosPendentes || 0}
                icon={Clock}
                color="text-amber-400"
                bgColor="bg-amber-500"
                delay={0.5}
              />

              <StatusCard
                title="Registrados"
                value={stats?.boletosRegistrados || 0}
                icon={FileText}
                color="text-blue-400"
                bgColor="bg-blue-500"
                delay={0.55}
              />

              <StatusCard
                title="Liquidados"
                value={stats?.boletosLiquidados || 0}
                icon={CheckCircle}
                color="text-green-400"
                bgColor="bg-green-500"
                delay={0.6}
              />

              <StatusCard
                title="Vencidos"
                value={stats?.boletosVencidos || 0}
                icon={AlertTriangle}
                color="text-red-400"
                bgColor="bg-red-500"
                delay={0.65}
              />

              <StatusCard
                title="Cancelados"
                value={stats?.boletosCancelados || 0}
                icon={XCircle}
                color="text-neutral-400"
                bgColor="bg-neutral-500"
                delay={0.7}
              />

              <StatusCard
                title="Outros"
                value={Math.max(
                  0,
                  (stats?.totalBoletos || 0) -
                    ((stats?.boletosPendentes || 0) +
                      (stats?.boletosRegistrados || 0) +
                      (stats?.boletosLiquidados || 0) +
                      (stats?.boletosVencidos || 0) +
                      (stats?.boletosCancelados || 0))
                )}
                icon={FileText}
                color="text-purple-400"
                bgColor="bg-purple-500"
                delay={0.75}
              />
            </div>

            {/* Barra de progresso visual */}
            {stats && stats.totalBoletos > 0 && (
              <div className="mt-8 p-4 bg-neutral-800/50 rounded-xl border border-neutral-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-neutral-400">
                    Taxa de Sucesso
                  </span>
                  <span className="text-sm font-bold text-green-400">
                    {formatPercentage(
                      stats.boletosLiquidados || 0,
                      stats.totalBoletos
                    )}
                  </span>
                </div>
                <div className="w-full bg-neutral-700 rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: formatPercentage(
                        stats.boletosLiquidados || 0,
                        stats.totalBoletos
                      ),
                    }}
                    transition={{ duration: 1, delay: 0.8 }}
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full shadow-sm"
                  />
                </div>
              </div>
            )}
          </motion.div>

          {/* Métricas Adicionais com cards modernos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Mensal */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
              className="bg-neutral-900/95 backdrop-blur-xl rounded-3xl border border-neutral-800 shadow-xl p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-100">
                    Performance Mensal
                  </h3>
                </div>
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Receipt className="w-5 h-5 text-blue-400" />
                    <span className="font-medium text-neutral-300">
                      Boletos criados
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-neutral-100">
                      {stats?.boletosEsteMes || 0}
                    </p>
                    <p className="text-xs text-neutral-500">este mês</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-green-400" />
                    <span className="font-medium text-neutral-300">
                      Média diária
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-neutral-100">
                      {stats?.boletosEsteMes
                        ? Math.round((stats.boletosEsteMes / 30) * 10) / 10
                        : 0}
                    </p>
                    <p className="text-xs text-neutral-500">boletos/dia</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-amber-400" />
                    <span className="font-medium text-neutral-300">
                      Meta mensal
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-neutral-100">85%</p>
                    <p className="text-xs text-neutral-500">atingido</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Taxas de Cobrança */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 1 }}
              className="bg-neutral-900/95 backdrop-blur-xl rounded-3xl border border-neutral-800 shadow-xl p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-100">
                    Eficiência de Cobrança
                  </h3>
                </div>
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>

              <div className="space-y-6">
                {/* Taxa de Liquidação */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-neutral-400">
                      Taxa de liquidação
                    </span>
                    <span className="text-lg font-bold text-green-400">
                      {stats?.totalBoletos
                        ? Math.round(
                            ((stats.boletosLiquidados || 0) /
                              stats.totalBoletos) *
                              100
                          )
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-neutral-700 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${
                          stats?.totalBoletos
                            ? Math.round(
                                ((stats.boletosLiquidados || 0) /
                                  stats.totalBoletos) *
                                  100
                              )
                            : 0
                        }%`,
                      }}
                      transition={{ duration: 1, delay: 1.2 }}
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                    />
                  </div>
                </div>

                {/* Taxa de Inadimplência */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-neutral-400">
                      Taxa de inadimplência
                    </span>
                    <span className="text-lg font-bold text-red-400">
                      {stats?.totalBoletos
                        ? Math.round(
                            ((stats.boletosVencidos || 0) /
                              stats.totalBoletos) *
                              100
                          )
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-neutral-700 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${
                          stats?.totalBoletos
                            ? Math.round(
                                ((stats.boletosVencidos || 0) /
                                  stats.totalBoletos) *
                                  100
                              )
                            : 0
                        }%`,
                      }}
                      transition={{ duration: 1, delay: 1.3 }}
                      className="h-full bg-gradient-to-r from-red-500 to-pink-500 rounded-full"
                    />
                  </div>
                </div>

                {/* Valor médio */}
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-neutral-300">
                      Valor médio por boleto
                    </span>
                    <p className="text-xl font-bold text-amber-400">
                      {stats?.totalBoletos && stats?.valorTotalRegistrado
                        ? formatCurrency(
                            stats.valorTotalRegistrado / stats.totalBoletos
                          )
                        : formatCurrency(0)}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Empty State com animação */}
          {(!stats || stats.totalBoletos === 0) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center py-20"
            >
              <div className="relative inline-block">
                <FileText className="w-24 h-24 text-neutral-700 mx-auto mb-6" />
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
                  className="absolute inset-0 bg-amber-400/20 blur-3xl rounded-full"
                />
              </div>
              <p className="text-2xl font-bold text-neutral-300 mb-2">
                Nenhum boleto encontrado
              </p>
              <p className="text-neutral-500 max-w-md mx-auto">
                Comece criando boletos para visualizar as estatísticas
                financeiras e acompanhar o desempenho
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="mt-6 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Criar Primeiro Boleto
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
