"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Calendar,
  User,
  Phone,
  Mail,
  FileText,
  ChevronRight,
  RefreshCw,
  Search,
  Filter,
} from "lucide-react";
import { apiClient } from "@/lib/api";

interface ClienteRisco {
  clienteId: number;
  nomeCliente: string;
  documento: string;
  tipoPessoa: string;
  scoreRisco: number;
  nivelRisco: string;
  corRisco: string;
  totalBoletos: number;
  boletosAtrasados: number;
  boletosPagos: number;
  valorTotalDevido: number;
  valorEmAtraso: number;
  diasAtrasoMedio: number;
  ultimoPagamento: string | null;
  fatoresRisco: string[];
}

interface ResumoRisco {
  totalClientesAnalisados: number;
  clientesAltoRisco: number;
  clientesMedioRisco: number;
  clientesBaixoRisco: number;
  valorTotalEmRisco: number;
  top5ClientesRisco: ClienteRisco[];
  dataAnalise: string;
}

interface RiscoInadimplenciaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RiscoInadimplenciaModal({
  isOpen,
  onClose,
}: RiscoInadimplenciaModalProps) {
  const [resumo, setResumo] = useState<ResumoRisco | null>(null);
  const [clientes, setClientes] = useState<ClienteRisco[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroRisco, setFiltroRisco] = useState<string>("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [clienteSelecionado, setClienteSelecionado] =
    useState<ClienteRisco | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchDados();
    }
  }, [isOpen]);

  const fetchDados = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resumoRes, clientesRes] = await Promise.all([
        apiClient.get<ResumoRisco>("/AnaliseRisco/resumo"),
        apiClient.get<ClienteRisco[]>("/AnaliseRisco/clientes"),
      ]);

      if (resumoRes.data) setResumo(resumoRes.data);
      if (clientesRes.data) setClientes(clientesRes.data);
    } catch (err) {
      console.error("Erro ao buscar dados de risco:", err);
      setError("Erro ao carregar análise de risco");
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

  const formatDate = (date: string | null) => {
    if (!date) return "Nunca";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const clientesFiltrados = clientes.filter((cliente) => {
    const matchesFiltro =
      filtroRisco === "todos" ||
      cliente.nivelRisco.toLowerCase() === filtroRisco.toLowerCase();

    const matchesSearch =
      !searchTerm ||
      cliente.nomeCliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.documento.includes(searchTerm);

    return matchesFiltro && matchesSearch;
  });

  const getRiskIcon = (nivel: string) => {
    switch (nivel) {
      case "Alto":
        return "🔴";
      case "Médio":
        return "🟡";
      case "Baixo":
        return "🟢";
      default:
        return "⚪";
    }
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
          className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[calc(100vh-8rem)] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex-shrink-0 bg-gradient-to-r from-red-600 to-orange-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    Análise de Risco de Inadimplência
                  </h2>
                  <p className="text-white/80 text-sm">
                    Previsão baseada em histórico de pagamentos
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchDados}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title="Atualizar análise"
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
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <RefreshCw className="w-12 h-12 animate-spin text-orange-600 mx-auto mb-4" />
                  <p className="text-gray-600">
                    Analisando dados de inadimplência...
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600">{error}</p>
                <button
                  onClick={fetchDados}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Tentar novamente
                </button>
              </div>
            ) : (
              <>
                {/* Resumo Cards */}
                {resumo && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">🔴</span>
                        <span className="text-sm font-medium text-red-800">
                          Alto Risco
                        </span>
                      </div>
                      <p className="text-3xl font-bold text-red-700">
                        {resumo.clientesAltoRisco}
                      </p>
                      <p className="text-xs text-red-600">clientes</p>
                    </div>

                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">🟡</span>
                        <span className="text-sm font-medium text-amber-800">
                          Médio Risco
                        </span>
                      </div>
                      <p className="text-3xl font-bold text-amber-700">
                        {resumo.clientesMedioRisco}
                      </p>
                      <p className="text-xs text-amber-600">clientes</p>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">🟢</span>
                        <span className="text-sm font-medium text-green-800">
                          Baixo Risco
                        </span>
                      </div>
                      <p className="text-3xl font-bold text-green-700">
                        {resumo.clientesBaixoRisco}
                      </p>
                      <p className="text-xs text-green-600">clientes</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-medium text-purple-800">
                          Valor em Risco
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-purple-700">
                        {formatCurrency(resumo.valorTotalEmRisco)}
                      </p>
                      <p className="text-xs text-purple-600">total em atraso</p>
                    </div>
                  </div>
                )}

                {/* Filtros */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar por nome ou documento..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    {["todos", "alto", "médio", "baixo"].map((filtro) => (
                      <button
                        key={filtro}
                        onClick={() => setFiltroRisco(filtro)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all capitalize ${
                          filtroRisco === filtro
                            ? "bg-orange-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {filtro === "todos" ? "Todos" : filtro}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lista de Clientes */}
                <div className="space-y-3">
                  {clientesFiltrados.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>
                        Nenhum cliente encontrado com os filtros selecionados
                      </p>
                    </div>
                  ) : (
                    clientesFiltrados.map((cliente) => (
                      <motion.div
                        key={cliente.clienteId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`rounded-xl border-2 p-4 cursor-pointer transition-all hover:shadow-lg ${
                          cliente.nivelRisco === "Alto"
                            ? "border-red-200 bg-red-50 hover:border-red-400"
                            : cliente.nivelRisco === "Médio"
                            ? "border-amber-200 bg-amber-50 hover:border-amber-400"
                            : "border-green-200 bg-green-50 hover:border-green-400"
                        }`}
                        onClick={() =>
                          setClienteSelecionado(
                            clienteSelecionado?.clienteId === cliente.clienteId
                              ? null
                              : cliente
                          )
                        }
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div
                              className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                              style={{
                                backgroundColor: cliente.corRisco + "20",
                              }}
                            >
                              {getRiskIcon(cliente.nivelRisco)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-900">
                                  {cliente.nomeCliente}
                                </h3>
                                <span
                                  className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                                  style={{ backgroundColor: cliente.corRisco }}
                                >
                                  {cliente.nivelRisco}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">
                                {cliente.tipoPessoa === "PF" ? "CPF" : "CNPJ"}:{" "}
                                {cliente.documento}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-sm">
                                <span className="text-gray-600">
                                  <strong>{cliente.boletosAtrasados}</strong>{" "}
                                  boleto(s) em atraso
                                </span>
                                <span className="text-gray-600">
                                  Média:{" "}
                                  <strong>{cliente.diasAtrasoMedio}</strong>{" "}
                                  dias
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm text-gray-500">
                                Score:
                              </span>
                              <span
                                className="text-2xl font-bold"
                                style={{ color: cliente.corRisco }}
                              >
                                {cliente.scoreRisco}
                              </span>
                            </div>
                            <p className="text-lg font-semibold text-red-600">
                              {formatCurrency(cliente.valorEmAtraso)}
                            </p>
                            <p className="text-xs text-gray-500">em atraso</p>
                          </div>
                        </div>

                        {/* Detalhes expandidos */}
                        <AnimatePresence>
                          {clienteSelecionado?.clienteId ===
                            cliente.clienteId && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="mt-4 pt-4 border-t border-gray-200"
                            >
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <div>
                                  <p className="text-xs text-gray-500">
                                    Total de Boletos
                                  </p>
                                  <p className="font-semibold">
                                    {cliente.totalBoletos}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">
                                    Boletos Pagos
                                  </p>
                                  <p className="font-semibold text-green-600">
                                    {cliente.boletosPagos}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">
                                    Valor Total Devido
                                  </p>
                                  <p className="font-semibold">
                                    {formatCurrency(cliente.valorTotalDevido)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">
                                    Último Pagamento
                                  </p>
                                  <p className="font-semibold">
                                    {formatDate(cliente.ultimoPagamento)}
                                  </p>
                                </div>
                              </div>

                              {cliente.fatoresRisco.length > 0 && (
                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-2">
                                    Fatores de Risco:
                                  </p>
                                  <ul className="space-y-1">
                                    {cliente.fatoresRisco.map((fator, idx) => (
                                      <li
                                        key={idx}
                                        className="flex items-center gap-2 text-sm text-gray-600"
                                      >
                                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                                        {fator}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-gray-200 text-center text-sm text-gray-500">
                  <p>
                    Análise realizada em:{" "}
                    {resumo
                      ? new Date(resumo.dataAnalise).toLocaleString("pt-BR")
                      : "-"}
                  </p>
                  <p className="mt-1">
                    {resumo?.totalClientesAnalisados || 0} clientes analisados
                  </p>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
