"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  History,
  Calendar,
  User,
  MapPin,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import type { Cliente } from "@/types/api";

interface HistoricoItem {
  id: number;
  clienteId: number;
  tipoAcao: string;
  descricao: string;
  dadosAnteriores?: string;
  dadosNovos?: string;
  usuarioId: number;
  usuarioNome: string;
  dataHora: string;
  enderecoIP?: string;
}

interface HistoricoClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  cliente: Cliente;
}

export function HistoricoClienteModal({
  isOpen,
  onClose,
  cliente,
}: HistoricoClienteModalProps) {
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedItem, setExpandedItem] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && cliente) {
      fetchHistorico();
    }
  }, [isOpen, cliente]);

  const fetchHistorico = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<HistoricoItem[]>(
        `/HistoricoCliente/cliente/${cliente.id}`
      );

      if (response.error) {
        throw new Error(response.error);
      }

      setHistorico(response.data || []);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar histórico");
      console.error("Erro ao buscar histórico:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  };

  const getTipoAcaoBadge = (tipoAcao: string) => {
    const badges: Record<string, { bg: string; text: string }> = {
      "Mudança de Status": { bg: "bg-purple-100", text: "text-purple-800" },
      Atualização: { bg: "bg-blue-100", text: "text-blue-800" },
      Criação: { bg: "bg-green-100", text: "text-green-800" },
      Exclusão: { bg: "bg-red-100", text: "text-red-800" },
    };

    const badge = badges[tipoAcao] || badges["Atualização"];

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}
      >
        {tipoAcao}
      </span>
    );
  };

  const toggleExpand = (id: number) => {
    setExpandedItem(expandedItem === id ? null : id);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <History className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Histórico do Cliente
                </h2>
                <p className="text-blue-100 text-sm">
                  {cliente.nome || cliente.razaoSocial}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Erro ao carregar histórico
                </h3>
                <p className="text-gray-600">{error}</p>
              </div>
            ) : historico.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhum histórico encontrado
                </h3>
                <p className="text-gray-600">
                  Este cliente ainda não possui histórico de alterações.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {historico.map((item) => (
                  <div
                    key={item.id}
                    className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden"
                  >
                    {/* Item Header */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          {getTipoAcaoBadge(item.tipoAcao)}
                        </div>
                        <button
                          onClick={() => toggleExpand(item.id)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                        >
                          Ver detalhes
                          {expandedItem === item.id ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Calendar className="w-4 h-4" />
                        {formatDate(item.dataHora)}
                      </div>

                      <div className="bg-blue-50 rounded-lg p-3 mb-3">
                        <div className="flex items-start gap-2">
                          <User className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-blue-900">
                              Alterado por:
                            </div>
                            <div className="text-sm text-blue-700">
                              {item.usuarioNome}
                            </div>
                          </div>
                          {item.enderecoIP && (
                            <div className="flex items-center gap-1 text-xs text-blue-600">
                              <MapPin className="w-3 h-3" />
                              {item.enderecoIP}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-sm text-gray-700">
                        {item.descricao}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedItem === item.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-200 bg-white p-4"
                      >
                        {item.dadosAnteriores || item.dadosNovos ? (
                          <div className="space-y-3">
                            {item.dadosAnteriores && (
                              <div>
                                <h4 className="text-xs font-semibold text-gray-700 uppercase mb-2">
                                  Dados Anteriores
                                </h4>
                                <pre className="text-xs bg-red-50 border border-red-200 rounded-lg p-3 overflow-x-auto text-red-900">
                                  {JSON.stringify(
                                    JSON.parse(item.dadosAnteriores),
                                    null,
                                    2
                                  )}
                                </pre>
                              </div>
                            )}
                            {item.dadosNovos && (
                              <div>
                                <h4 className="text-xs font-semibold text-gray-700 uppercase mb-2">
                                  Dados Novos
                                </h4>
                                <pre className="text-xs bg-green-50 border border-green-200 rounded-lg p-3 overflow-x-auto text-green-900">
                                  {JSON.stringify(
                                    JSON.parse(item.dadosNovos),
                                    null,
                                    2
                                  )}
                                </pre>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">
                            Nenhum detalhe adicional disponível.
                          </p>
                        )}
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

