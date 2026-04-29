"use client";

import React, { useState } from "react";
import { X, Building2, DollarSign, User, Phone, Mail, Briefcase, FileText, Target } from "lucide-react";

interface NovoLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NovoLeadData) => Promise<void>;
}

export interface NovoLeadData {
  nomeEmpresa: string;
  valorEstimado: number;
  origem?: string;
  contatoNome?: string;
  contatoTelefone?: string;
  contatoEmail?: string;
  contatoCargo?: string;
  necessidade?: string;
  observacoes?: string;
  probabilidade?: number;
}

const ORIGENS = [
  "Indicação",
  "Site",
  "LinkedIn",
  "Evento",
  "Cold Call",
  "Google",
  "Parceiro",
  "Outro",
];

export const NovoLeadModal: React.FC<NovoLeadModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<NovoLeadData>({
    nomeEmpresa: "",
    valorEstimado: 0,
    origem: "",
    contatoNome: "",
    contatoTelefone: "",
    contatoEmail: "",
    contatoCargo: "",
    necessidade: "",
    observacoes: "",
    probabilidade: 50,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nomeEmpresa.trim()) return;

    setLoading(true);
    try {
      await onSubmit(formData);
      // Reset form
      setFormData({
        nomeEmpresa: "",
        valorEstimado: 0,
        origem: "",
        contatoNome: "",
        contatoTelefone: "",
        contatoEmail: "",
        contatoCargo: "",
        necessidade: "",
        observacoes: "",
        probabilidade: 50,
      });
      onClose();
    } catch (error) {
      console.error("Erro ao criar lead:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Target className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-50">Novo Lead</h2>
              <p className="text-sm text-neutral-400">
                Adicione uma nova oportunidade ao pipeline
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="space-y-6">
            {/* Informações da Empresa */}
            <div>
              <h3 className="text-sm font-semibold text-neutral-300 mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-400" />
                Informações da Empresa
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                    Nome da Empresa *
                  </label>
                  <input
                    type="text"
                    name="nomeEmpresa"
                    value={formData.nomeEmpresa}
                    onChange={handleChange}
                    required
                    placeholder="Ex: Empresa ABC Ltda"
                    className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                    Origem
                  </label>
                  <select
                    name="origem"
                    value={formData.origem}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="">Selecione...</option>
                    {ORIGENS.map((origem) => (
                      <option key={origem} value={origem}>
                        {origem}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                    Necessidade
                  </label>
                  <input
                    type="text"
                    name="necessidade"
                    value={formData.necessidade}
                    onChange={handleChange}
                    placeholder="Ex: Assessoria trabalhista"
                    className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Valores */}
            <div>
              <h3 className="text-sm font-semibold text-neutral-300 mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-400" />
                Valores
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                    Valor Estimado (R$)
                  </label>
                  <input
                    type="number"
                    name="valorEstimado"
                    value={formData.valorEstimado || ""}
                    onChange={handleChange}
                    min="0"
                    step="100"
                    placeholder="0,00"
                    className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                    Probabilidade (%)
                  </label>
                  <input
                    type="number"
                    name="probabilidade"
                    value={formData.probabilidade || ""}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    placeholder="50"
                    className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Contato */}
            <div>
              <h3 className="text-sm font-semibold text-neutral-300 mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-400" />
                Dados do Contato
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                    Nome do Contato
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                      type="text"
                      name="contatoNome"
                      value={formData.contatoNome}
                      onChange={handleChange}
                      placeholder="Nome completo"
                      className="w-full pl-10 pr-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                    Cargo
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                      type="text"
                      name="contatoCargo"
                      value={formData.contatoCargo}
                      onChange={handleChange}
                      placeholder="Ex: Diretor"
                      className="w-full pl-10 pr-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                    Telefone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                      type="tel"
                      name="contatoTelefone"
                      value={formData.contatoTelefone}
                      onChange={handleChange}
                      placeholder="(00) 00000-0000"
                      className="w-full pl-10 pr-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                      type="email"
                      name="contatoEmail"
                      value={formData.contatoEmail}
                      onChange={handleChange}
                      placeholder="email@empresa.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Observações */}
            <div>
              <h3 className="text-sm font-semibold text-neutral-300 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" />
                Observações
              </h3>
              <textarea
                name="observacoes"
                value={formData.observacoes}
                onChange={handleChange}
                rows={3}
                placeholder="Informações adicionais sobre o lead..."
                className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-800 bg-neutral-900/50">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.nomeEmpresa.trim()}
            className="flex items-center gap-2 px-6 py-2 bg-amber-500 text-neutral-950 rounded-lg font-medium hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-neutral-950 border-t-transparent" />
                Salvando...
              </>
            ) : (
              "Criar Lead"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

