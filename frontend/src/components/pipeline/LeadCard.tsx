"use client";

import React from "react";
import { Lead } from "@/hooks/useLeads";
import {
  Building2,
  User,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LeadCardProps {
  lead: Lead;
  onClick: () => void;
  isDragging?: boolean;
}

export const LeadCard: React.FC<LeadCardProps> = ({
  lead,
  onClick,
  isDragging = false,
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return "Nunca";
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
    } catch {
      return "Data inválida";
    }
  };

  const getOrigemColor = (origem: string | null) => {
    switch (origem?.toLowerCase()) {
      case "indicação":
      case "indicacao":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "site":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "evento":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "linkedin":
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
      case "cold call":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      default:
        return "bg-neutral-700 text-neutral-300 border-neutral-600";
    }
  };

  const isUrgent = () => {
    if (!lead.dataUltimaInteracao) return true;
    const daysSinceLastInteraction =
      (Date.now() - new Date(lead.dataUltimaInteracao).getTime()) /
      (1000 * 60 * 60 * 24);
    return daysSinceLastInteraction > 7;
  };

  const isProximaAcaoAtrasada = () => {
    if (!lead.dataProximaAcao) return false;
    return new Date(lead.dataProximaAcao) < new Date();
  };

  return (
    <div
      onClick={onClick}
      className={`
        bg-neutral-900 border border-neutral-800 rounded-xl p-4 cursor-pointer
        transition-all duration-200 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10
        ${isDragging ? "opacity-50 rotate-2" : ""}
        ${isUrgent() || isProximaAcaoAtrasada() ? "border-red-500/50" : ""}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-sm font-bold text-neutral-50 mb-1 line-clamp-2">
            {lead.nomeEmpresa}
          </h3>
          {lead.origem && (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getOrigemColor(
                lead.origem
              )}`}
            >
              {lead.origem}
            </span>
          )}
        </div>
        {(isUrgent() || isProximaAcaoAtrasada()) && (
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 ml-2" />
        )}
      </div>

      {/* Valor e Probabilidade */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-lg font-bold text-amber-400">
            {formatCurrency(lead.valorEstimado)}
          </span>
        </div>
        {lead.probabilidade !== null && (
          <span className="text-xs font-medium text-neutral-400">
            {lead.probabilidade}%
          </span>
        )}
      </div>

      {/* Contato */}
      {lead.contatoNome && (
        <div className="flex items-center gap-2 mb-2">
          <User className="w-3.5 h-3.5 text-neutral-500" />
          <span className="text-xs text-neutral-300 truncate">
            {lead.contatoNome}
            {lead.contatoCargo && (
              <span className="text-neutral-500"> • {lead.contatoCargo}</span>
            )}
          </span>
        </div>
      )}

      {/* Telefone */}
      {lead.contatoTelefone && (
        <div className="flex items-center gap-2 mb-2">
          <Phone className="w-3.5 h-3.5 text-neutral-500" />
          <span className="text-xs text-neutral-300">
            {lead.contatoTelefone}
          </span>
        </div>
      )}

      {/* Email */}
      {lead.contatoEmail && (
        <div className="flex items-center gap-2 mb-3">
          <Mail className="w-3.5 h-3.5 text-neutral-500" />
          <span className="text-xs text-neutral-300 truncate">
            {lead.contatoEmail}
          </span>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-neutral-800 my-3" />

      {/* Footer */}
      <div className="space-y-2">
        {/* Responsável */}
        {lead.responsavelNome && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500">Responsável:</span>
            <span className="text-xs font-medium text-neutral-300">
              {lead.responsavelNome}
            </span>
          </div>
        )}

        {/* Última Interação */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-neutral-500">Última interação:</span>
          <span
            className={`text-xs font-medium ${
              isUrgent() ? "text-red-400" : "text-neutral-300"
            }`}
          >
            {formatTimeAgo(lead.dataUltimaInteracao)}
          </span>
        </div>

        {/* Próxima Ação */}
        {lead.dataProximaAcao && (
          <div className="flex items-center gap-1 mt-2 p-2 bg-neutral-800/50 rounded-lg">
            <Calendar className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-neutral-400">Próxima ação:</p>
              <p
                className={`text-xs font-medium truncate ${
                  isProximaAcaoAtrasada() ? "text-red-400" : "text-neutral-200"
                }`}
              >
                {lead.proximaAcao || "Não definida"}
              </p>
            </div>
          </div>
        )}

        {/* Interações */}
        {lead.totalInteracoes > 0 && (
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-neutral-500">Interações:</span>
            <span className="text-xs font-medium text-amber-400">
              {lead.totalInteracoes}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
