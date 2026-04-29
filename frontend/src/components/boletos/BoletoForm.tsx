// src/components/boletos/BoletoForm.tsx
"use client";

import { useState, useEffect } from "react";
import { CreateBoletoDTO, DescontoDTO, DescontoValorDTO } from "@/types/boleto";
import { X, Plus, Minus } from "lucide-react";

interface BoletoFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateBoletoDTO) => Promise<void>;
  contratos?: Array<{
    id: number;
    numeroContrato: string;
    clienteNome?: string;
    valorNegociado?: number;
  }>;
  loading?: boolean;
}

export function BoletoForm({
  isOpen,
  onClose,
  onSubmit,
  contratos = [],
  loading = false,
}: BoletoFormProps) {
  const [formData, setFormData] = useState<CreateBoletoDTO>({
    contratoId: 0,
    dueDate: "",
    nominalValue: 0,
    clientNumber: "",
    finePercentage: undefined,
    fineQuantityDays: undefined,
    interestPercentage: undefined,
    deductionValue: undefined,
    writeOffQuantityDays: undefined,
    messages: [],
    discount: undefined,
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [messageInput, setMessageInput] = useState("");

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setFormData({
        contratoId: 0,
        dueDate: "",
        nominalValue: 0,
        clientNumber: "",
        finePercentage: undefined,
        fineQuantityDays: undefined,
        interestPercentage: undefined,
        deductionValue: undefined,
        writeOffQuantityDays: undefined,
        messages: [],
        discount: undefined,
      });
      setShowAdvanced(false);
      setMessageInput("");
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.contratoId || !formData.dueDate || !formData.nominalValue) {
      alert("Preencha os campos obrigatórios");
      return;
    }

    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error("Erro ao criar boleto:", error);
    }
  };

  const handleInputChange = (field: keyof CreateBoletoDTO, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addMessage = () => {
    if (messageInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        messages: [...(prev.messages || []), messageInput.trim()],
      }));
      setMessageInput("");
    }
  };

  const removeMessage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      messages: (prev.messages || []).filter((_, i) => i !== index),
    }));
  };

  const handleDiscountChange = (
    type: "discountOne" | "discountTwo" | "discountThree",
    field: keyof DescontoValorDTO,
    value: any
  ) => {
    setFormData((prev) => {
      const discount = prev.discount || { type: "VALOR_DATA_FIXA" };
      const discountValue = discount[type] || { value: 0, limitDate: "" };

      return {
        ...prev,
        discount: {
          ...discount,
          [type]: {
            ...discountValue,
            [field]: value,
          },
        },
      };
    });
  };

  const selectedContrato = contratos.find((c) => c.id === formData.contratoId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999] p-4">
      <div className="bg-neutral-900/95 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-700">
          <h2 className="text-2xl font-bold text-neutral-50">Novo Boleto</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-neutral-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Campos Obrigatórios */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-neutral-50">
              Informações Obrigatórias
            </h3>

            {/* Contrato */}
            <div>
              <label className="block text-sm font-medium text-neutral-200 mb-1">
                Contrato *
              </label>
              <select
                value={formData.contratoId}
                onChange={(e) =>
                  handleInputChange("contratoId", parseInt(e.target.value))
                }
                className="w-full px-3 py-2 border border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value={0}>Selecione um contrato</option>
                {contratos.map((contrato) => (
                  <option key={contrato.id} value={contrato.id}>
                    {contrato.numeroContrato} - {contrato.clienteNome}
                    {contrato.valorNegociado &&
                      ` (R$ ${contrato.valorNegociado.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Valor e Vencimento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-200 mb-1">
                  Valor Nominal (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.nominalValue || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "nominalValue",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="w-full px-3 py-2 border border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0,00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-200 mb-1">
                  Data de Vencimento *
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleInputChange("dueDate", e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2 border border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* Seu Número */}
            <div>
              <label className="block text-sm font-medium text-neutral-200 mb-1">
                Seu Número (Opcional)
              </label>
              <input
                type="text"
                value={formData.clientNumber || ""}
                onChange={(e) =>
                  handleInputChange("clientNumber", e.target.value)
                }
                className="w-full px-3 py-2 border border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Número de referência do cliente"
                maxLength={15}
              />
            </div>
          </div>

          {/* Toggle para campos avançados */}
          <div className="border-t border-neutral-700 pt-4">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
            >
              {showAdvanced ? (
                <Minus className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {showAdvanced ? "Ocultar" : "Mostrar"} opções avançadas
            </button>
          </div>

          {/* Campos Avançados */}
          {showAdvanced && (
            <div className="space-y-6 border-t border-neutral-700 pt-4">
              <h3 className="text-lg font-semibold text-neutral-50">
                Opções Avançadas
              </h3>

              {/* Multa e Juros */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-200 mb-1">
                    Percentual de Multa (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="99.99"
                    value={formData.finePercentage || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "finePercentage",
                        parseFloat(e.target.value) || undefined
                      )
                    }
                    className="w-full px-3 py-2 border border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="2,00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-200 mb-1">
                    Dias para Multa
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={formData.fineQuantityDays || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "fineQuantityDays",
                        parseInt(e.target.value) || undefined
                      )
                    }
                    className="w-full px-3 py-2 border border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-200 mb-1">
                    Percentual de Juros (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="99.99"
                    value={formData.interestPercentage || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "interestPercentage",
                        parseFloat(e.target.value) || undefined
                      )
                    }
                    className="w-full px-3 py-2 border border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0,33"
                  />
                </div>
              </div>

              {/* Abatimento e Baixa */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-200 mb-1">
                    Valor de Abatimento (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.deductionValue || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "deductionValue",
                        parseFloat(e.target.value) || undefined
                      )
                    }
                    className="w-full px-3 py-2 border border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0,00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-200 mb-1">
                    Dias para Baixa
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={formData.writeOffQuantityDays || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "writeOffQuantityDays",
                        parseInt(e.target.value) || undefined
                      )
                    }
                    className="w-full px-3 py-2 border border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="60"
                  />
                </div>
              </div>

              {/* Mensagens */}
              <div>
                <label className="block text-sm font-medium text-neutral-200 mb-2">
                  Mensagens (até 4 mensagens de 40 caracteres cada)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addMessage())
                    }
                    className="flex-1 px-3 py-2 border border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Digite uma mensagem"
                    maxLength={40}
                  />
                  <button
                    type="button"
                    onClick={addMessage}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    disabled={
                      !messageInput.trim() ||
                      (formData.messages?.length || 0) >= 4
                    }
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {formData.messages && formData.messages.length > 0 && (
                  <div className="space-y-1">
                    {formData.messages.map((message, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-neutral-800/50 p-2 rounded"
                      >
                        <span className="text-sm">{message}</span>
                        <button
                          type="button"
                          onClick={() => removeMessage(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-neutral-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-neutral-600 rounded-lg hover:bg-neutral-800/50 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? "Criando..." : "Criar Boleto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
