// src/components/MudancaSituacaoModal.tsx
"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  RefreshCcw,
  AlertCircle,
  Calendar,
  MessageSquare,
  Save,
  Loader2,
  TrendingUp,
} from "lucide-react";
import {
  Contrato,
  MudancaSituacaoDTO,
  SituacaoContratoOptions,
  SituacaoContrato,
} from "@/types/api";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MudancaSituacaoModalProps {
  contrato: Contrato;
  onSubmit: (data: MudancaSituacaoDTO) => Promise<void>;
  onClose: () => void;
}

function SituacaoBadge({ situacao }: { situacao: SituacaoContrato }) {
  const config = SituacaoContratoOptions.find((opt) => opt.value === situacao);

  if (!config) {
    return <span className="text-xs text-gray-500">Desconhecido</span>;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        config.color
      )}
    >
      {config.label}
    </span>
  );
}

export default function MudancaSituacaoModal({
  contrato,
  onSubmit,
  onClose,
}: MudancaSituacaoModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [formData, setFormData] = useState<MudancaSituacaoDTO>({
    novaSituacao: contrato.situacao,
    motivoMudanca: "",
    dataUltimoContato: new Date().toISOString().split("T")[0],
    dataProximoContato: "",
    valorNegociado: contrato.valorNegociado,
    observacoes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Definir data próximo contato como 3 dias no futuro por padrão
  useState(() => {
    const proximoContato = new Date();
    proximoContato.setDate(proximoContato.getDate() + 3);
    setFormData((prev) => ({
      ...prev,
      dataProximoContato: proximoContato.toISOString().split("T")[0],
    }));
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.novaSituacao) {
      newErrors.novaSituacao = "Nova situação é obrigatória";
    } else if (formData.novaSituacao === contrato.situacao) {
      newErrors.novaSituacao = "A nova situação deve ser diferente da atual";
    }

    if (!formData.motivoMudanca || formData.motivoMudanca.trim() === "") {
      newErrors.motivoMudanca = "Motivo da mudança é obrigatório";
    } else if (formData.motivoMudanca.length < 10) {
      newErrors.motivoMudanca = "Motivo deve ter pelo menos 10 caracteres";
    }

    if (formData.dataProximoContato) {
      const proximoContato = new Date(formData.dataProximoContato);
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      if (proximoContato < hoje) {
        newErrors.dataProximoContato =
          "Data do próximo contato deve ser futura";
      }
    }

    if (formData.valorNegociado && formData.valorNegociado < 0) {
      newErrors.valorNegociado = "Valor negociado não pode ser negativo";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      // Limpar campos vazios antes de enviar
      const dataToSubmit: MudancaSituacaoDTO = {
        novaSituacao: formData.novaSituacao,
        motivoMudanca: formData.motivoMudanca,
      };

      if (formData.dataUltimoContato) {
        dataToSubmit.dataUltimoContato = formData.dataUltimoContato;
      }

      if (formData.dataProximoContato) {
        dataToSubmit.dataProximoContato = formData.dataProximoContato;
      }

      if (formData.valorNegociado && formData.valorNegociado > 0) {
        dataToSubmit.valorNegociado = formData.valorNegociado;
      }

      if (formData.observacoes && formData.observacoes.trim() !== "") {
        dataToSubmit.observacoes = formData.observacoes;
      }

      await onSubmit(dataToSubmit);
      onClose();
    } catch (error) {
      console.error("Erro ao mudar situação:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // Função para formatar valor monetário
  const formatCurrency = (value: number | undefined) => {
    if (!value) return "";
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Função para fazer parse do valor monetário
  const parseCurrency = (value: string) => {
    if (!value) return undefined;
    // Remove pontos e substitui vírgula por ponto
    const cleanValue = value.replace(/\./g, "").replace(",", ".");
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? undefined : parsed;
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (name === "valorNegociado") {
      // Tratamento especial para valor negociado
      const parsedValue = parseCurrency(value);
      setFormData((prev) => ({
        ...prev,
        [name]: parsedValue,
      }));
    } else if (type === "number") {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? undefined : parseFloat(value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "Não informado";
    try {
      return format(parseISO(date), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return date;
    }
  };

  // Filtrar situações disponíveis (remover a situação atual)
  const situacoesDisponiveis = SituacaoContratoOptions.filter(
    (opt) => opt.value !== contrato.situacao
  );

  // Sugestões de motivos baseadas na mudança de situação
  const getSugestaoMotivo = () => {
    const { novaSituacao } = formData;
    const situacaoAtual = contrato.situacao;

    if (!novaSituacao || novaSituacao === situacaoAtual) return "";

    const sugestoes: Record<string, string> = {
      "Leed-Prospecto": "Cliente demonstrou interesse inicial",
      "Prospecto-Negociacao": "Cliente avançou para fase de negociação",
      "Negociacao-Fechado": "Contrato fechado com sucesso",
      "Negociacao-Perdido": "Cliente optou por não prosseguir",
      "Perdido-Reativacao": "Iniciando processo de reativação do cliente",
      "Fechado-Reativacao": "Cliente solicitou reativação do contrato",
    };

    const chave = `${situacaoAtual}-${novaSituacao}`;
    return sugestoes[chave] || "";
  };

  if (!mounted) return null;

  const modalContent = (
    <AnimatePresence>
      {/* Overlay */}
      <motion.div
        key="mudanca-situacao-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[99999]"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        key="mudanca-situacao-modal"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-0 flex items-center justify-center z-[99999] p-4"
      >
        <div className="bg-neutral-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-neutral-800 w-full max-w-lg max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-neutral-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg">
                  <RefreshCcw className="w-5 h-5 text-neutral-900" />
                </div>
                <div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                    Mudar Situação do Contrato
                  </h2>
                  <p className="text-sm text-neutral-400">
                    Contrato #{contrato.id}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/30"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Situação Atual */}
          <div className="px-6 py-4 bg-neutral-900/30 border-b border-neutral-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 mb-1">Situação Atual</p>
                <SituacaoBadge situacao={contrato.situacao} />
              </div>
              <TrendingUp className="w-5 h-5 text-amber-400" />
              <div>
                <p className="text-xs text-neutral-400 mb-1">Nova Situação</p>
                {formData.novaSituacao &&
                formData.novaSituacao !== contrato.situacao ? (
                  <SituacaoBadge situacao={formData.novaSituacao} />
                ) : (
                  <span className="text-sm text-neutral-500">Selecione</span>
                )}
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4 max-h-[calc(90vh-280px)] overflow-y-auto">
              {/* Nova Situação */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Nova Situação *
                </label>
                <select
                  name="novaSituacao"
                  value={formData.novaSituacao}
                  onChange={handleInputChange}
                  className={cn(
                    "w-full px-4 py-2.5 bg-neutral-900/50 border rounded-lg text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent transition-all",
                    errors.novaSituacao
                      ? "border-red-500 bg-red-500/10"
                      : "border-neutral-700",
                    "[&>option]:bg-neutral-900 [&>option]:text-neutral-200"
                  )}
                >
                  <option value={contrato.situacao} disabled className="text-neutral-500">
                    {
                      SituacaoContratoOptions.find(
                        (opt) => opt.value === contrato.situacao
                      )?.label
                    }{" "}
                    (Atual)
                  </option>
                  {situacoesDisponiveis.map((option) => (
                    <option key={option.value} value={option.value} className="bg-neutral-900 text-neutral-200">
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.novaSituacao && (
                  <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.novaSituacao}
                  </p>
                )}
              </div>

              {/* Motivo da Mudança */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Motivo da Mudança *
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-neutral-500" />
                  <textarea
                    name="motivoMudanca"
                    value={formData.motivoMudanca}
                    onChange={handleInputChange}
                    rows={3}
                    className={cn(
                      "w-full pl-10 pr-4 py-2.5 bg-neutral-900/50 border rounded-lg text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent transition-all resize-none",
                      errors.motivoMudanca
                        ? "border-red-500 bg-red-500/10"
                        : "border-neutral-700"
                    )}
                    placeholder={
                      getSugestaoMotivo() || "Descreva o motivo da mudança..."
                    }
                  />
                </div>
                {errors.motivoMudanca && (
                  <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.motivoMudanca}
                  </p>
                )}
                {getSugestaoMotivo() && !formData.motivoMudanca && (
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        motivoMudanca: getSugestaoMotivo(),
                      }))
                    }
                    className="mt-1 text-xs text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    Usar sugestão: &quot;{getSugestaoMotivo()}&quot;
                  </button>
                )}
              </div>

              {/* Campos Opcionais */}
              <div className="pt-4 border-t border-neutral-800">
                <p className="text-sm font-medium text-neutral-300 mb-3">
                  Campos Opcionais - Atualize se necessário
                </p>

                {/* Datas */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">
                      Data Último Contato
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                      <input
                        type="date"
                        name="dataUltimoContato"
                        value={formData.dataUltimoContato}
                        onChange={handleInputChange}
                        className="w-full pl-9 pr-3 py-2 bg-neutral-900/50 border border-neutral-700 rounded-lg text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">
                      Data Próximo Contato
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                      <input
                        type="date"
                        name="dataProximoContato"
                        value={formData.dataProximoContato}
                        onChange={handleInputChange}
                        className={cn(
                          "w-full pl-9 pr-3 py-2 bg-neutral-900/50 border rounded-lg text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent transition-all",
                          errors.dataProximoContato
                            ? "border-red-500 bg-red-500/10"
                            : "border-neutral-700"
                        )}
                      />
                    </div>
                    {errors.dataProximoContato && (
                      <p className="mt-1 text-xs text-red-400">
                        {errors.dataProximoContato}
                      </p>
                    )}
                  </div>
                </div>

                {/* Valor Negociado */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-neutral-400 mb-1">
                    Valor Negociado
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500">
                      R$
                    </span>
                    <input
                      type="text"
                      name="valorNegociado"
                      value={formatCurrency(formData.valorNegociado)}
                      onChange={handleInputChange}
                      className={cn(
                        "w-full pl-10 pr-3 py-2 bg-neutral-900/50 border rounded-lg text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent transition-all",
                        errors.valorNegociado
                          ? "border-red-500 bg-red-500/10"
                          : "border-neutral-700"
                      )}
                      placeholder="0,00"
                    />
                  </div>
                  {errors.valorNegociado && (
                    <p className="mt-1 text-xs text-red-400">
                      {errors.valorNegociado}
                    </p>
                  )}
                </div>

                {/* Observações Adicionais */}
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">
                    Observações Adicionais
                  </label>
                  <textarea
                    name="observacoes"
                    value={formData.observacoes}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3 py-2 bg-neutral-900/50 border border-neutral-700 rounded-lg text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent transition-all resize-none"
                    placeholder="Informações adicionais sobre a mudança..."
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-neutral-800">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="px-4 py-2 text-neutral-300 bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700 rounded-lg font-medium transition-colors"
                disabled={submitting}
              >
                Cancelar
              </motion.button>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-neutral-900 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/30"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Confirmar Mudança
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
