// src/components/UltimosBoletosPagos.tsx
"use client";
import React, { memo } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Calendar,
  User,
  FileText,
  CheckCircle,
  Clock,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import {
  useUltimosBoletosPagos,
  UltimoBoletoPago,
} from "@/hooks/useUltimosBoletosPagos";
import { formatCurrency, formatDate } from "@/lib/formatUtils";

interface UltimosBoletosPagosProps {
  className?: string;
}

// Componente para item individual de boleto - Otimizado com memo
const BoletoPagoItem = memo(({ boleto }: { boleto: UltimoBoletoPago }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 5, scale: 1.02 }}
      className="flex items-center space-x-3 p-3 rounded-xl
                 bg-gradient-to-r from-green-50/50 to-emerald-50/50
                 border border-green-200/30 hover:border-green-300/50
                 transition-all duration-200 cursor-pointer"
    >
      {/* Ícone de Status */}
      <div
        className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500
                      rounded-lg flex items-center justify-center shadow-lg shadow-green-500/20"
      >
        <CheckCircle className="w-5 h-5 text-white" />
      </div>

      {/* Informações do Boleto */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-sm font-semibold text-gray-900 truncate">
            {boleto.Cliente.Nome}
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              boleto.Cliente.Tipo === "PF"
                ? "bg-blue-100 text-blue-700"
                : "bg-purple-100 text-purple-700"
            }`}
          >
            {boleto.Cliente.Tipo}
          </span>
        </div>

        <div className="flex items-center space-x-4 text-xs text-gray-600">
          <div className="flex items-center space-x-1">
            <FileText className="w-3 h-3" />
            <span>#{boleto.Id}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(boleto.DataCadastro)}</span>
          </div>
        </div>
      </div>

      {/* Valor */}
      <div className="flex-shrink-0 text-right">
        <div className="text-sm font-bold text-green-600">
          {formatCurrency(boleto.NominalValue)}
        </div>
        <div className="text-xs text-gray-500">{boleto.Status}</div>
      </div>
    </motion.div>
  );
});

BoletoPagoItem.displayName = "BoletoPagoItem";

// Componente Principal
export const UltimosBoletosPagos = memo(
  ({ className = "" }: UltimosBoletosPagosProps) => {
    const { boletos, loading, error, lastUpdate, refresh, hasData } =
      useUltimosBoletosPagos();

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white rounded-2xl shadow-lg border border-gray-200/50 ${className}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500
                          rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20"
            >
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Últimos Pagamentos
              </h3>
              <p className="text-sm text-gray-500">
                {hasData
                  ? `Últimos ${boletos.length} boletos pagos`
                  : "Nenhum boleto pago"}
              </p>
            </div>
          </div>

          <button
            onClick={refresh}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Atualizar"
          >
            <RefreshCw
              className={`w-4 h-4 text-gray-600 ${
                loading ? "animate-spin" : ""
              }`}
            />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6">
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50"
                >
                  <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />
                    <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                  </div>
                  <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-6 h-6 text-red-600" />
              </div>
              <p className="text-red-600 font-medium mb-1">Erro ao carregar</p>
              <p className="text-sm text-gray-500">{error}</p>
              <button
                onClick={refresh}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          ) : !hasData ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium mb-1">Nenhum pagamento</p>
              <p className="text-sm text-gray-400">
                Os boletos pagos aparecerão aqui
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {boletos.map((boleto) => (
                <BoletoPagoItem key={boleto.Id} boleto={boleto} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {hasData && lastUpdate && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 rounded-b-2xl">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Atualizado em {lastUpdate.toLocaleTimeString()}</span>
              <button
                onClick={refresh}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Ver todos os boletos →
              </button>
            </div>
          </div>
        )}
      </motion.div>
    );
  }
);

UltimosBoletosPagos.displayName = "UltimosBoletosPagos";
