"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  BarChart3,
  RefreshCw,
  ChevronRight,
  Target,
  Percent,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import {
  ForecastResumo,
  ForecastMensal,
  ForecastPipeline,
  ForecastBoleto,
} from "@/hooks/useForecast";

interface ForecastModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ForecastModal({ isOpen, onClose }: ForecastModalProps) {
  const [resumo, setResumo] = useState<ForecastResumo | null>(null);
  const [mensal, setMensal] = useState<ForecastMensal[]>([]);
  const [pipeline, setPipeline] = useState<ForecastPipeline | null>(null);
  const [boletos, setBoletos] = useState<ForecastBoleto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"resumo" | "mensal" | "pipeline">(
    "resumo"
  );

  useEffect(() => {
    if (isOpen) {
      fetchDados();
    }
  }, [isOpen]);

  const fetchDados = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resumoRes, mensalRes, pipelineRes, boletosRes] = await Promise.all(
        [
          apiClient.get<ForecastResumo>("/Forecast/resumo"),
          apiClient.get<ForecastMensal[]>("/Forecast/mensal?meses=6"),
          apiClient.get<ForecastPipeline>("/Forecast/pipeline"),
          apiClient.get<ForecastBoleto[]>("/Forecast/boletos-a-vencer?dias=30"),
        ]
      );

      if (resumoRes.data) setResumo(resumoRes.data);
      if (mensalRes.data) setMensal(mensalRes.data);
      if (pipelineRes.data) setPipeline(pipelineRes.data);
      if (boletosRes.data) setBoletos(boletosRes.data);
    } catch (err) {
      console.error("Erro ao buscar dados de forecast:", err);
      setError("Erro ao carregar previsão de receita");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-16 pb-8 px-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: -20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[calc(100vh-8rem)] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Previsão de Receita</h2>
                  <p className="text-white/80 text-sm">
                    Forecast baseado em contratos e boletos
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchDados}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title="Atualizar"
                >
                  <RefreshCw
                    className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
                  />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mt-4">
              {[
                { id: "resumo", label: "Resumo", icon: BarChart3 },
                { id: "mensal", label: "Projeção Mensal", icon: Calendar },
                { id: "pipeline", label: "Pipeline", icon: Target },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() =>
                    setActiveTab(tab.id as "resumo" | "mensal" | "pipeline")
                  }
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-white text-blue-600"
                      : "bg-white/20 text-white hover:bg-white/30"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">Calculando previsões...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <TrendingDown className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600">{error}</p>
                <button
                  onClick={fetchDados}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Tentar novamente
                </button>
              </div>
            ) : (
              <>
                {/* Tab: Resumo */}
                {activeTab === "resumo" && resumo && (
                  <div className="space-y-6">
                    {/* Cards de Resumo */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="w-5 h-5 text-green-600" />
                          <span className="text-sm font-medium text-green-800">
                            Este Mês
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-green-700">
                          {formatCurrency(resumo.receitaEsperadaMesAtual)}
                        </p>
                        <p className="text-xs text-green-600">
                          receita esperada
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-5 h-5 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">
                            Próximo Mês
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-blue-700">
                          {formatCurrency(resumo.receitaEsperadaProximoMes)}
                        </p>
                        <p className="text-xs text-blue-600">projetado</p>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                        <div className="flex items-center gap-2 mb-2">
                          <BarChart3 className="w-5 h-5 text-purple-600" />
                          <span className="text-sm font-medium text-purple-800">
                            Trimestre
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-purple-700">
                          {formatCurrency(resumo.receitaEsperadaTrimestre)}
                        </p>
                        <p className="text-xs text-purple-600">
                          próximos 3 meses
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="w-5 h-5 text-orange-600" />
                          <span className="text-sm font-medium text-orange-800">
                            Pipeline
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-orange-700">
                          {formatCurrency(resumo.receitaPipelineEstimada)}
                        </p>
                        <p className="text-xs text-orange-600">
                          {resumo.totalContratosEmNegociacao} contratos
                        </p>
                      </div>
                    </div>

                    {/* Métricas Adicionais */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">
                            Média Mensal (3 meses)
                          </span>
                          <span className="text-xl font-bold text-gray-900">
                            {formatCurrency(resumo.mediaReceitaMensal)}
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">
                            Taxa de Conversão
                          </span>
                          <span className="text-xl font-bold text-gray-900">
                            {resumo.taxaConversaoHistorica}%
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">
                            Boletos a Vencer
                          </span>
                          <span className="text-xl font-bold text-gray-900">
                            {resumo.totalBoletosAVencer}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Boletos Próximos */}
                    {boletos.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                          Próximos Boletos a Vencer (30 dias)
                        </h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {boletos.slice(0, 10).map((boleto) => (
                            <div
                              key={boleto.boletoId}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
                            >
                              <div>
                                <p className="font-medium text-gray-900">
                                  {boleto.nomeCliente}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Vence em {formatDate(boleto.dataVencimento)} (
                                  {boleto.diasParaVencer} dias)
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-green-600">
                                  {formatCurrency(boleto.valor)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab: Projeção Mensal */}
                {activeTab === "mensal" && (
                  <div className="space-y-6">
                    {/* Gráfico de Barras Simples */}
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Projeção dos Próximos 6 Meses
                      </h3>
                      <div className="flex items-end justify-between gap-4 h-48">
                        {mensal.map((mes, index) => {
                          const maxValor = Math.max(
                            ...mensal.map((m) =>
                              Math.max(m.receitaConfirmada, m.receitaProjetada)
                            )
                          );
                          const alturaConfirmada =
                            maxValor > 0
                              ? (mes.receitaConfirmada / maxValor) * 100
                              : 0;
                          const alturaProjetada =
                            maxValor > 0
                              ? (mes.receitaProjetada / maxValor) * 100
                              : 0;

                          return (
                            <div
                              key={index}
                              className="flex-1 flex flex-col items-center"
                            >
                              <div className="w-full flex gap-1 items-end h-40">
                                <div
                                  className="flex-1 bg-blue-500 rounded-t transition-all"
                                  style={{ height: `${alturaConfirmada}%` }}
                                  title={`Confirmado: ${formatCurrency(
                                    mes.receitaConfirmada
                                  )}`}
                                />
                                <div
                                  className="flex-1 bg-blue-200 rounded-t transition-all"
                                  style={{ height: `${alturaProjetada}%` }}
                                  title={`Projetado: ${formatCurrency(
                                    mes.receitaProjetada
                                  )}`}
                                />
                              </div>
                              <span className="text-xs text-gray-600 mt-2 capitalize">
                                {mes.nomeMes.substring(0, 3)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-center gap-6 mt-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded" />
                          <span className="text-sm text-gray-600">
                            Confirmado
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-200 rounded" />
                          <span className="text-sm text-gray-600">
                            Projetado
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Tabela Detalhada */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 text-gray-600 font-medium">
                              Mês
                            </th>
                            <th className="text-right py-3 px-4 text-gray-600 font-medium">
                              Confirmado
                            </th>
                            <th className="text-right py-3 px-4 text-gray-600 font-medium">
                              Projetado
                            </th>
                            <th className="text-center py-3 px-4 text-gray-600 font-medium">
                              Boletos
                            </th>
                            <th className="text-center py-3 px-4 text-gray-600 font-medium">
                              Tendência
                            </th>
                            <th className="text-center py-3 px-4 text-gray-600 font-medium">
                              Confiabilidade
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {mensal.map((mes, index) => (
                            <tr
                              key={index}
                              className="border-b border-gray-100 hover:bg-gray-50"
                            >
                              <td className="py-3 px-4 capitalize font-medium">
                                {mes.nomeMes} {mes.ano}
                              </td>
                              <td className="py-3 px-4 text-right font-semibold text-green-600">
                                {formatCurrency(mes.receitaConfirmada)}
                              </td>
                              <td className="py-3 px-4 text-right text-gray-600">
                                {formatCurrency(mes.receitaProjetada)}
                              </td>
                              <td className="py-3 px-4 text-center">
                                {mes.quantidadeBoletos}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span
                                  className={`inline-flex items-center gap-1 ${
                                    mes.tendencia >= 0
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {mes.tendencia >= 0 ? (
                                    <TrendingUp className="w-4 h-4" />
                                  ) : (
                                    <TrendingDown className="w-4 h-4" />
                                  )}
                                  {Math.abs(mes.tendencia)}%
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    mes.confiabilidade === "Alta"
                                      ? "bg-green-100 text-green-700"
                                      : mes.confiabilidade === "Média"
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  {mes.confiabilidade}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Tab: Pipeline */}
                {activeTab === "pipeline" && pipeline && (
                  <div className="space-y-6">
                    {/* Resumo do Pipeline */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                        <p className="text-sm text-blue-600 mb-1">
                          Valor Total Pipeline
                        </p>
                        <p className="text-2xl font-bold text-blue-700">
                          {formatCurrency(pipeline.valorTotalPipeline)}
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                        <p className="text-sm text-green-600 mb-1">
                          Valor Ponderado (Estimado)
                        </p>
                        <p className="text-2xl font-bold text-green-700">
                          {formatCurrency(pipeline.valorPonderadoTotal)}
                        </p>
                      </div>
                      <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                        <p className="text-sm text-purple-600 mb-1">
                          Total de Contratos
                        </p>
                        <p className="text-2xl font-bold text-purple-700">
                          {pipeline.totalContratos}
                        </p>
                      </div>
                    </div>

                    {/* Funil de Vendas */}
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Funil de Vendas
                      </h3>
                      <div className="space-y-3">
                        {pipeline.etapas.map((etapa, index) => {
                          const maxValor = Math.max(
                            ...pipeline.etapas.map((e) => e.valorTotal)
                          );
                          const largura =
                            maxValor > 0
                              ? (etapa.valorTotal / maxValor) * 100
                              : 0;

                          return (
                            <div key={index} className="space-y-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: etapa.cor }}
                                  />
                                  <span className="font-medium text-gray-900">
                                    {etapa.etapa}
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    ({etapa.quantidade})
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="font-semibold text-gray-900">
                                    {formatCurrency(etapa.valorTotal)}
                                  </span>
                                  <span className="text-sm text-gray-500 ml-2">
                                    ({etapa.probabilidade}%)
                                  </span>
                                </div>
                              </div>
                              <div className="h-8 bg-gray-200 rounded-lg overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${largura}%` }}
                                  transition={{
                                    duration: 0.5,
                                    delay: index * 0.1,
                                  }}
                                  className="h-full rounded-lg flex items-center justify-end pr-2"
                                  style={{ backgroundColor: etapa.cor }}
                                >
                                  {largura > 20 && (
                                    <span className="text-white text-sm font-medium">
                                      {formatCurrency(etapa.valorPonderado)}
                                    </span>
                                  )}
                                </motion.div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Legenda */}
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                      <div className="flex items-start gap-2">
                        <Percent className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-amber-800">
                            Sobre o Valor Ponderado
                          </p>
                          <p className="text-sm text-amber-700">
                            O valor ponderado é calculado multiplicando o valor
                            total de cada etapa pela probabilidade de conversão.
                            Lead (10%), Prospecto (30%), Contrato Enviado (70%),
                            Contrato Assinado (100%).
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-500 text-center">
              Análise realizada em:{" "}
              {resumo
                ? new Date(resumo.dataAnalise).toLocaleString("pt-BR")
                : "-"}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
