"use client";

import React, { useState } from "react";
import MainLayout from "@/components/MainLayout";
import { useNotificacoes, Notificacao } from "@/hooks/useNotificacoes";
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  DollarSign,
  AlertTriangle,
  Info,
  Loader2,
} from "lucide-react";

export default function NotificacoesPage() {
  const {
    notificacoes,
    loading,
    countNaoLidas,
    marcarComoLida,
    marcarTodasComoLidas,
    refresh,
  } = useNotificacoes();
  const [filtro, setFiltro] = useState<"todas" | "nao-lidas">("todas");

  const notificacoesFiltradas =
    filtro === "nao-lidas" ? notificacoes.filter((n) => !n.lida) : notificacoes;

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case "BoletoPago":
        return <DollarSign className="w-5 h-5 text-green-400" />;
      case "BoletoVencido":
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case "ContatoAgendado":
        return <Clock className="w-5 h-5 text-blue-400" />;
      default:
        return <Info className="w-5 h-5 text-neutral-400" />;
    }
  };

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case "Alta":
        return "border-l-red-500";
      case "Media":
        return "border-l-yellow-500";
      default:
        return "border-l-blue-500";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return `há ${diffMinutes} minuto${diffMinutes !== 1 ? "s" : ""}`;
      }
      return `há ${diffHours} hora${diffHours !== 1 ? "s" : ""}`;
    } else if (diffDays === 1) {
      return "ontem";
    } else if (diffDays < 7) {
      return `há ${diffDays} dias`;
    } else {
      return date.toLocaleDateString("pt-BR");
    }
  };

  const handleMarcarLida = async (notificacao: Notificacao) => {
    if (!notificacao.lida) {
      await marcarComoLida(notificacao.id);
    }
    // Navegar para o link se existir
    if (notificacao.link) {
      window.location.href = notificacao.link;
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-neutral-950 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8 text-yellow-500" />
            <div>
              <h1 className="text-2xl font-bold text-white">Notificações</h1>
              <p className="text-neutral-400 text-sm">
                {countNaoLidas > 0
                  ? `${countNaoLidas} notificação${
                      countNaoLidas !== 1 ? "ões" : ""
                    } não lida${countNaoLidas !== 1 ? "s" : ""}`
                  : "Todas as notificações lidas"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Filtro */}
            <select
              value={filtro}
              onChange={(e) =>
                setFiltro(e.target.value as "todas" | "nao-lidas")
              }
              className="bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-yellow-500"
            >
              <option value="todas">Todas</option>
              <option value="nao-lidas">Não lidas</option>
            </select>

            {/* Marcar todas como lidas */}
            {countNaoLidas > 0 && (
              <button
                onClick={marcarTodasComoLidas}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors text-sm"
              >
                <CheckCheck className="w-4 h-4" />
                Marcar todas como lidas
              </button>
            )}

            {/* Atualizar */}
            <button
              onClick={() => refresh()}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Atualizar"
              )}
            </button>
          </div>
        </div>

        {/* Lista de Notificações */}
        <div className="space-y-3">
          {loading && notificacoes.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
            </div>
          ) : notificacoesFiltradas.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
              <p className="text-neutral-400">
                {filtro === "nao-lidas"
                  ? "Nenhuma notificação não lida"
                  : "Nenhuma notificação encontrada"}
              </p>
            </div>
          ) : (
            notificacoesFiltradas.map((notificacao) => (
              <div
                key={notificacao.id}
                onClick={() => handleMarcarLida(notificacao)}
                className={`
                  bg-neutral-900 border-l-4 rounded-lg p-4 cursor-pointer
                  hover:bg-neutral-800 transition-colors
                  ${getPrioridadeColor(notificacao.prioridade)}
                  ${!notificacao.lida ? "ring-1 ring-yellow-500/30" : ""}
                `}
              >
                <div className="flex items-start gap-4">
                  {/* Ícone */}
                  <div
                    className={`
                    w-12 h-12 rounded-full flex items-center justify-center
                    ${
                      notificacao.tipo === "BoletoPago"
                        ? "bg-green-500/20"
                        : notificacao.tipo === "BoletoVencido"
                        ? "bg-red-500/20"
                        : "bg-neutral-800"
                    }
                  `}
                  >
                    {getIcon(notificacao.tipo)}
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white">
                        {notificacao.titulo}
                      </h3>
                      {!notificacao.lida && (
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <p className="text-neutral-300 text-sm mb-2">
                      {notificacao.mensagem}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-neutral-500">
                      <span>{formatDate(notificacao.dataCriacao)}</span>
                      {notificacao.nomeCliente && (
                        <span className="text-neutral-400">
                          • {notificacao.nomeCliente}
                        </span>
                      )}
                      {notificacao.lida && notificacao.dataLeitura && (
                        <span className="flex items-center gap-1 text-green-500">
                          <Check className="w-3 h-3" />
                          Lida
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Badge de prioridade */}
                  <div
                    className={`
                    px-2 py-1 rounded text-xs font-medium
                    ${
                      notificacao.prioridade === "Alta"
                        ? "bg-red-500/20 text-red-400"
                        : notificacao.prioridade === "Media"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-blue-500/20 text-blue-400"
                    }
                  `}
                  >
                    {notificacao.prioridade}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Total */}
        {notificacoesFiltradas.length > 0 && (
          <div className="mt-6 text-center text-neutral-500 text-sm">
            Mostrando {notificacoesFiltradas.length} notificação
            {notificacoesFiltradas.length !== 1 ? "ões" : ""}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
