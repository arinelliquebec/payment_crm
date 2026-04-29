"use client";
import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  User,
  Clock,
  MapPin,
  Monitor,
  Shield,
  Search,
  Filter,
  Users as UsersIcon,
  AlertTriangle,
} from "lucide-react";
import { SessaoAtiva } from "@/hooks/useSessoesAtivas";
import { useAuth } from "@/contexts/AuthContext";

interface SessoesAtivasModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessoes: SessaoAtiva[];
  loading: boolean;
  countOnline?: number;
}

export function SessoesAtivasModal({
  isOpen,
  onClose,
  sessoes,
  loading,
  countOnline = 0,
}: SessoesAtivasModalProps) {
  const { permissoes } = useAuth();
  const isAdmin = permissoes?.grupo === "Administrador";
  const [filtroStatus, setFiltroStatus] = useState<
    "todos" | "online" | "offline"
  >("todos");
  const [searchTerm, setSearchTerm] = useState("");

  const getPerfilColor = (perfil: string) => {
    switch (perfil?.toLowerCase()) {
      case "admin":
      case "administrador":
        return "bg-red-100 text-red-800 border-red-200";
      case "gerente":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "consultor":
        return "bg-green-100 text-green-800 border-green-200";
      case "vendedor":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatTempoOnline = (tempo: string) => {
    if (!tempo || tempo === "00:00:00") {
      return "0m";
    }

    // Se vier no formato hh:mm:ss, converter para formato legível
    const parts = tempo.split(":");
    if (parts.length === 3) {
      const hours = parseInt(parts[0]);
      const minutes = parseInt(parts[1]);

      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else if (minutes > 0) {
        return `${minutes}m`;
      } else {
        return "< 1m";
      }
    }

    return tempo || "0m";
  };

  // Função para parsear data do backend (já vem em horário de Brasília)
  const parseBackendDate = (data: string | null): Date | null => {
    if (!data) return null;

    try {
      // O backend envia datas em horário de Brasília (UTC-3)
      // Se a data não tem timezone info, adicionar o offset de Brasília
      let dateStr = data;
      
      // Se não tem 'Z' nem offset (+/- horas), assumir que é Brasília (UTC-3)
      if (!dateStr.includes('Z') && !dateStr.match(/[+-]\d{2}:\d{2}$/)) {
        dateStr = data + '-03:00';
      }
      
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  };

  const formatDataHora = (data: string | null) => {
    if (!data) return "Nunca acessou";

    try {
      const date = parseBackendDate(data);
      if (!date) return "Data inválida";

      // Formatar a data no timezone de Brasília (America/Sao_Paulo)
      // para exibir corretamente independente do timezone do browser
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
  };

  const formatUltimaAtividade = (data: string | null) => {
    if (!data) return "Nunca";

    const date = parseBackendDate(data);
    if (!date) return "Data inválida";

    // A data do backend já está em horário de Brasília
    // new Date() já considera o timezone local do browser
    // Então a comparação direta funciona se o browser estiver em Brasília
    const agora = new Date();
    const diffMs = agora.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / (1000 * 60));

    // Se a diferença for negativa ou muito pequena, mostrar "Agora"
    if (diffMin <= 1) return "Agora";
    if (diffMin < 60) return `${diffMin}m atrás`;

    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "1 dia atrás";
    if (diffDays < 7) return `${diffDays} dias atrás`;

    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 4)
      return `${diffWeeks} semana${diffWeeks > 1 ? "s" : ""} atrás`;

    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths} ${diffMonths > 1 ? "meses" : "mês"} atrás`;
  };

  // Filtrar e ordenar sessões
  const sessoesFiltradas = useMemo(() => {
    let filtered = sessoes;

    // Filtro por status
    if (filtroStatus === "online") {
      filtered = filtered.filter((s) => s.estaOnline);
    } else if (filtroStatus === "offline") {
      filtered = filtered.filter((s) => !s.estaOnline);
    }

    // Filtro por busca
    if (searchTerm) {
      const termo = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.nomeUsuario.toLowerCase().includes(termo) ||
          s.email.toLowerCase().includes(termo) ||
          s.perfil.toLowerCase().includes(termo)
      );
    }

    return filtered;
  }, [sessoes, filtroStatus, searchTerm]);

  const countOffline = sessoes.length - countOnline;

  // Se não for administrador, não mostrar o modal
  if (!isAdmin) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500 rounded-lg shadow-lg">
                  <UsersIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Histórico de Acessos
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-semibold text-green-600">
                      {countOnline} online
                    </span>{" "}
                    •{" "}
                    <span className="font-semibold text-gray-500">
                      {countOffline} offline
                    </span>{" "}
                    •{" "}
                    <span className="text-gray-500">
                      {sessoes.length} total
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Filtros */}
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Busca */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nome, email ou perfil..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Filtro de Status */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setFiltroStatus("todos")}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      filtroStatus === "todos"
                        ? "bg-purple-500 text-white shadow-md"
                        : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-300"
                    }`}
                  >
                    Todos ({sessoes.length})
                  </button>
                  <button
                    onClick={() => setFiltroStatus("online")}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      filtroStatus === "online"
                        ? "bg-green-500 text-white shadow-md"
                        : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-300"
                    }`}
                  >
                    Online ({countOnline})
                  </button>
                  <button
                    onClick={() => setFiltroStatus("offline")}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      filtroStatus === "offline"
                        ? "bg-gray-500 text-white shadow-md"
                        : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-300"
                    }`}
                  >
                    Offline ({countOffline})
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-240px)]">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : sessoesFiltradas.length === 0 ? (
                <div className="text-center py-12">
                  <UsersIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchTerm || filtroStatus !== "todos"
                      ? "Nenhum usuário encontrado com os filtros selecionados"
                      : "Nenhum usuário cadastrado"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessoesFiltradas.map((sessao) => {
                    const estaOnline = sessao.estaOnline ?? false;

                    return (
                      <motion.div
                        key={`${sessao.usuarioId}-${sessao.id}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`rounded-xl p-4 border-2 transition-all ${
                          estaOnline
                            ? "bg-green-50 border-green-200 hover:border-green-300 hover:shadow-md"
                            : "bg-gray-50 border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div
                              className={`p-2 rounded-lg shadow-sm ${
                                estaOnline ? "bg-green-500" : "bg-gray-400"
                              }`}
                            >
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="font-semibold text-gray-900">
                                  {sessao.nomeUsuario}
                                </h3>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getPerfilColor(
                                    sessao.perfil
                                  )}`}
                                >
                                  {sessao.perfil}
                                </span>
                                {estaOnline && (
                                  <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500 text-white rounded-full text-xs font-medium animate-pulse">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                    Online
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-3 truncate">
                                {sessao.email}
                              </p>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                                {estaOnline ? (
                                  <>
                                    {/* Página Atual */}
                                    <div className="flex items-center gap-2 bg-purple-900/30 px-3 py-2 rounded-lg border-2 border-purple-500 col-span-full sm:col-span-2 lg:col-span-1">
                                      <MapPin
                                        className="w-5 h-5 flex-shrink-0 animate-pulse"
                                        style={{ color: "#a855f7" }}
                                      />
                                      <div className="flex-1 min-w-0">
                                        <span
                                          className="font-bold block text-xs uppercase tracking-wide"
                                          style={{ color: "#c084fc" }}
                                        >
                                          Página Atual:
                                        </span>
                                        <span
                                          className="truncate block font-bold text-lg"
                                          style={{ color: "#a855f7" }}
                                          title={
                                            sessao.paginaAtual ||
                                            "Não informado"
                                          }
                                        >
                                          {sessao.paginaAtual ||
                                            "Não informado"}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-gray-700">
                                      <Clock className="w-4 h-4 text-green-600" />
                                      <span>
                                        <span className="font-medium">
                                          Online há:
                                        </span>{" "}
                                        {formatTempoOnline(sessao.tempoOnline)}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-2 text-gray-700">
                                      <Monitor className="w-4 h-4 text-green-600" />
                                      <span>
                                        <span className="font-medium">
                                          Atividade:
                                        </span>{" "}
                                        {formatUltimaAtividade(
                                          sessao.ultimaAtividade
                                        )}
                                      </span>
                                    </div>

                                    {sessao.enderecoIP && (
                                      <div className="flex items-center gap-2 text-gray-700">
                                        <MapPin className="w-4 h-4 text-green-600" />
                                        <span>
                                          <span className="font-medium">
                                            IP:
                                          </span>{" "}
                                          {sessao.enderecoIP}
                                        </span>
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <div className="flex items-center gap-2 text-gray-600 col-span-full">
                                      <Clock className="w-4 h-4" />
                                      <span>
                                        <span className="font-medium">
                                          Último acesso:
                                        </span>{" "}
                                        {sessao.ultimoAcesso
                                          ? formatDataHora(sessao.ultimoAcesso)
                                          : "Nunca acessou"}
                                        {sessao.ultimoAcesso && (
                                          <span className="text-gray-500 ml-1">
                                            (
                                            {formatUltimaAtividade(
                                              sessao.ultimoAcesso
                                            )}
                                            )
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                    {sessao.tempoOnline &&
                                      sessao.tempoOnline !== "00:00:00" && (
                                        <div className="flex items-center gap-2 text-gray-600">
                                          <Monitor className="w-4 h-4" />
                                          <span>
                                            <span className="font-medium">
                                              Ficou online:
                                            </span>{" "}
                                            {formatTempoOnline(
                                              sessao.tempoOnline
                                            )}
                                          </span>
                                        </div>
                                      )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>
                  Mostrando {sessoesFiltradas.length} de {sessoes.length}{" "}
                  usuário{sessoes.length !== 1 ? "s" : ""}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Atualização automática a cada 30 segundos</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
