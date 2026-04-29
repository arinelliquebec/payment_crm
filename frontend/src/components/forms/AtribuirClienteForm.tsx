// src/components/forms/AtribuirClienteForm.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  X,
  UserPlus,
  Users,
  User,
  Save,
  Loader2,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { AtribuirClienteDTO, Cliente, Consultor } from "@/types/api";
import { cn } from "@/lib/utils";

interface AtribuirClienteFormProps {
  clientes: Cliente[];
  consultores: Consultor[];
  onSubmit: (data: AtribuirClienteDTO) => Promise<boolean>;
  onCancel: () => void;
  loading?: boolean;
}

export default function AtribuirClienteForm({
  clientes,
  consultores,
  onSubmit,
  onCancel,
  loading = false,
}: AtribuirClienteFormProps) {
  const [formData, setFormData] = useState<AtribuirClienteDTO>({
    consultorId: 0,
    clienteId: 0,
    motivoAtribuicao: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.consultorId) {
      newErrors.consultorId = "Selecione um consultor";
    }

    if (!formData.clienteId) {
      newErrors.clienteId = "Selecione um cliente";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const success = await onSubmit(formData);
    if (success) {
      onCancel();
    }
  };

  const getClienteDisplayName = (cliente: Cliente) => {
    if (cliente.tipoPessoa === "Fisica") {
      return cliente.pessoaFisica?.nome || "Nome não informado";
    } else {
      return cliente.pessoaJuridica?.razaoSocial || "Razão social não informada";
    }
  };

  const getConsultorDisplayName = (consultor: Consultor) => {
    return consultor.pessoaFisica?.nome || "Nome não informado";
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-neutral-900/95 rounded-2xl shadow-xl max-w-2xl w-full mx-auto"
    >
      <div className="flex items-center justify-between p-6 border-b border-secondary-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <UserPlus className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-secondary-900">
              Atribuir Cliente
            </h2>
            <p className="text-sm text-secondary-600">
              Vincule um cliente a um consultor
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="p-2 text-secondary-400 hover:text-secondary-600 rounded-lg transition-colors duration-200"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Cliente */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Cliente *
          </label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5" />
            <select
              value={formData.clienteId}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  clienteId: Number(e.target.value),
                }))
              }
              className={cn(
                "w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200",
                errors.clienteId
                  ? "border-red-300 focus:ring-red-500"
                  : "border-secondary-300"
              )}
            >
              <option value={0}>Selecione um cliente</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {getClienteDisplayName(cliente)} - {cliente.tipoPessoa}
                </option>
              ))}
            </select>
          </div>
          {errors.clienteId && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.clienteId}
            </p>
          )}
        </div>

        {/* Consultor */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Consultor *
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5" />
            <select
              value={formData.consultorId}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  consultorId: Number(e.target.value),
                }))
              }
              className={cn(
                "w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200",
                errors.consultorId
                  ? "border-red-300 focus:ring-red-500"
                  : "border-secondary-300"
              )}
            >
              <option value={0}>Selecione um consultor</option>
              {consultores.map((consultor) => (
                <option key={consultor.id} value={consultor.id}>
                                          {getConsultorDisplayName(consultor)} - {consultor.filial?.nome || "Filial não informada"}
                </option>
              ))}
            </select>
          </div>
          {errors.consultorId && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.consultorId}
            </p>
          )}
        </div>

        {/* Motivo da Atribuição */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Motivo da Atribuição
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 text-secondary-400 w-5 h-5" />
            <textarea
              value={formData.motivoAtribuicao}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  motivoAtribuicao: e.target.value,
                }))
              }
              rows={3}
              className="w-full pl-12 pr-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              placeholder="Descreva o motivo da atribuição (opcional)"
            />
          </div>
        </div>

        {/* Botões */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-secondary-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 text-secondary-700 bg-secondary-100 hover:bg-secondary-200 rounded-xl font-medium transition-colors duration-200"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-xl font-medium transition-colors duration-200"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <Save className="w-4 h-4" />
            <span>{loading ? "Atribuindo..." : "Atribuir"}</span>
          </button>
        </div>
      </form>
    </motion.div>
  );
}
