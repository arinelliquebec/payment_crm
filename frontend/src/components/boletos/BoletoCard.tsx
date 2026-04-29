// src/components/boletos/BoletoCard.tsx
import { Boleto, normalizarStatusBoleto } from "@/types/boleto";
import { StatusBadge } from "./StatusBadge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Eye,
  RefreshCw,
  Trash2,
  Mail,
  CheckCircle2,
  Calendar,
  Banknote,
} from "lucide-react";

interface BoletoCardProps {
  boleto: Boleto;
  onViewDetails?: (boleto: Boleto) => void;
  onSync?: (boleto: Boleto) => void;
  onDelete?: (boleto: Boleto) => void;
  onSendEmail?: (boleto: Boleto) => void;
  className?: string;
}

export function BoletoCard({
  boleto,
  onViewDetails,
  onSync,
  onDelete,
  onSendEmail,
  className = "",
}: BoletoCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  // Usar foiPago como fonte da verdade
  const isPago = boleto.foiPago === true || boleto.status === "LIQUIDADO";
  const isVencido =
    typeof boleto.estaVencido === "boolean"
      ? boleto.estaVencido
      : normalizarStatusBoleto(boleto.status) === "VENCIDO" ||
        (new Date(boleto.dueDate) < new Date() &&
          !isPago &&
          boleto.status !== "CANCELADO");
  const canSync = boleto.status === "REGISTRADO" || boleto.status === "ATIVO";
  const canDelete = !isPago && boleto.status !== "CANCELADO";
  // Pode enviar email para boletos registrados ou ativos (não pagos/cancelados)
  const canSendEmail =
    boleto.status === "REGISTRADO" || boleto.status === "ATIVO";

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Boleto #{boleto.id}
          </h3>
          <p className="text-sm text-gray-600">NSU: {boleto.nsuCode}</p>
        </div>
        <StatusBadge
          status={boleto.status}
          foiPago={boleto.foiPago}
          paidValue={boleto.paidValue}
        />
      </div>

      {/* Valor e Vencimento */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Valor</p>
          <p className="text-xl font-bold text-gray-900">
            {formatCurrency(boleto.nominalValue)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Vencimento</p>
          <p
            className={`text-sm font-medium ${
              isVencido ? "text-red-600" : "text-gray-900"
            }`}
          >
            {formatDate(boleto.dueDate)}
            {isVencido && <span className="ml-1 text-xs">(VENCIDO)</span>}
          </p>
        </div>
      </div>

      {/* Informações do Contrato */}
      {boleto.contrato && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg space-y-1">
          <p className="text-sm text-gray-600">Contrato</p>
          <div className="flex flex-wrap gap-1.5">
            {boleto.contrato.numeroPasta && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md">
                📁 {boleto.contrato.numeroPasta}
              </span>
            )}
            {boleto.contrato.tipoServico && (
              <span className="inline-flex items-center text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                {boleto.contrato.tipoServico}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-700">{boleto.contrato.clienteNome}</p>
          {boleto.contrato.valorContrato && (
            <p className="text-sm text-gray-600">
              Valor: {formatCurrency(boleto.contrato.valorContrato)}
            </p>
          )}
        </div>
      )}

      {/* Informações do Pagador */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-1">Pagador</p>
        <p className="text-sm font-medium text-gray-900">{boleto.payerName}</p>
        <p className="text-sm text-gray-700">
          {boleto.payerDocumentType}: {boleto.payerDocumentNumber}
        </p>
      </div>

      {/* Código de barras (se disponível) */}
      {boleto.digitableLine && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-1">Linha Digitável</p>
          <p className="text-xs font-mono bg-gray-50 p-2 rounded break-all">
            {boleto.digitableLine}
          </p>
        </div>
      )}

      {/* Data de cadastro */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Criado em: {formatDate(boleto.dataCadastro)}
        </p>
      </div>

      {/* Informações de Pagamento (para boletos pagos) */}
      {isPago && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-green-800">Boleto Pago</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {boleto.paidValue && (
              <div className="flex items-center gap-1 text-green-700">
                <Banknote className="w-4 h-4" />
                <span>Valor: {formatCurrency(boleto.paidValue)}</span>
              </div>
            )}
            {boleto.paymentDate && (
              <div className="flex items-center gap-1 text-green-700">
                <Calendar className="w-4 h-4" />
                <span>Data: {formatDate(boleto.paymentDate)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ações */}
      <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
        {/* Botão Detalhes sempre visível */}
        {onViewDetails && (
          <button
            onClick={() => onViewDetails(boleto)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title="Ver detalhes"
          >
            <Eye className="w-4 h-4" />
            Detalhes
          </button>
        )}

        {onSendEmail && canSendEmail && (
          <button
            onClick={() => onSendEmail(boleto)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
            title="Enviar boleto por email"
          >
            <Mail className="w-4 h-4" />
            Email
          </button>
        )}

        {onSync && canSync && (
          <button
            onClick={() => onSync(boleto)}
            className="flex items-center gap-1 px-3 py-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors"
            title="Sincronizar com Santander"
          >
            <RefreshCw className="w-4 h-4" />
            Sincronizar
          </button>
        )}

        {onDelete && canDelete && (
          <button
            onClick={() => onDelete(boleto)}
            className="flex items-center gap-1 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Cancelar boleto"
          >
            <Trash2 className="w-4 h-4" />
            Cancelar
          </button>
        )}

        {/* Indicador visual para boletos pagos quando não há outras ações */}
        {isPago && !canSync && !canSendEmail && !canDelete && (
          <div className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-600">
            <CheckCircle2 className="w-4 h-4" />
            <span>Quitado</span>
          </div>
        )}
      </div>
    </div>
  );
}
