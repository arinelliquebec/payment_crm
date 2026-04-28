// src/components/forms/ParceiroForm.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  X,
  User,
  Award,
  Save,
  Loader2,
  AlertCircle,
  ChevronDown,
  Search,
  Users,
  ArrowLeft,
  Building,
  Scale,
} from "lucide-react";
import {
  Parceiro,
  CreateParceiroDTO,
  UpdateParceiroDTO,
  PessoaFisica,
} from "@/types/api";
import { cn } from "@/lib/utils";
import { usePessoasFisicas } from "@/hooks/usePessoasFisicas";
import { useFiliais } from "@/hooks/useFiliais";
import ErrorDialog from "@/components/ErrorDialog";

interface ParceiroFormProps {
  initialData?: Parceiro | null;
  onSubmit: (data: CreateParceiroDTO | UpdateParceiroDTO) => Promise<boolean>;
  onCancel: () => void;
  onBackToList?: () => void;
  onNavigateToPessoaFisica?: () => void;
  loading?: boolean;
}

export default function ParceiroForm({
  initialData,
  onSubmit,
  onCancel,
  onBackToList,
  onNavigateToPessoaFisica,
  loading = false,
}: ParceiroFormProps) {
  const {
    pessoas: pessoasFisicas,
    loading: loadingPessoas,
    error: pessoasError,
    fetchPessoasFisicas,
    buscarPorCpf,
  } = usePessoasFisicas();

  const {
    filiais,
    loading: loadingFiliais,
    error: filiaisError,
    fetchFiliais,
  } = useFiliais();

  const [formData, setFormData] = useState<CreateParceiroDTO>({
    pessoaFisicaId: 0,
    filialId: 0,
    oab: "",
    email: "",
    telefone: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPessoaFisicaSelector, setShowPessoaFisicaSelector] =
    useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [cpfSearch, setCpfSearch] = useState("");
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [selectedPessoaFisica, setSelectedPessoaFisica] =
    useState<PessoaFisica | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        pessoaFisicaId: initialData.pessoaFisicaId || 0,
        filialId: initialData.filialId || 0,
        oab: initialData.oab || "",
        email: initialData.email || initialData.pessoaFisica?.email || "",
        telefone:
          initialData.telefone || initialData.pessoaFisica?.telefone1 || "",
      });
      setSelectedPessoaFisica(initialData.pessoaFisica || null);
    }
  }, [initialData]);

  useEffect(() => {
    fetchPessoasFisicas();
    fetchFiliais();
  }, [fetchPessoasFisicas, fetchFiliais]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.pessoaFisicaId || formData.pessoaFisicaId === 0) {
      newErrors.pessoaFisicaId = "Pessoa física é obrigatória";
    }

    if (!formData.filialId || formData.filialId === 0) {
      newErrors.filialId = "Filial é obrigatória";
    }

    if (formData.oab && formData.oab.length > 20) {
      newErrors.oab = "OAB deve ter no máximo 20 caracteres";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const submitData = initialData
        ? ({ ...formData, id: initialData.id } as UpdateParceiroDTO)
        : formData;

      const success = await onSubmit(submitData);
      if (success) {
        onCancel();
      }
    } catch (error: any) {
      console.error("Erro ao salvar parceiro:", error);
      setShowErrorDialog(true);
    }
  };

  const handleInputChange = (field: keyof CreateParceiroDTO, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handlePessoaFisicaSelect = (pessoa: PessoaFisica) => {
    setSelectedPessoaFisica(pessoa);
    handleInputChange("pessoaFisicaId", pessoa.id);
    handleInputChange("email", pessoa.email || "");
    handleInputChange("telefone", pessoa.telefone1 || "");
    setShowPessoaFisicaSelector(false);
    setSearchTerm("");
    setCpfSearch("");
  };

  const handleBuscarPorCpf = async () => {
    if (cpfSearch.length >= 11) {
      try {
        const pessoa = await buscarPorCpf(cpfSearch);
        if (pessoa) {
          handlePessoaFisicaSelect(pessoa);
        } else {
          alert("Pessoa física não encontrada com este CPF");
        }
      } catch (error) {
        console.error("Erro ao buscar por CPF:", error);
        alert("Erro ao buscar pessoa física");
      }
    }
  };

  const filteredPessoasFisicas = pessoasFisicas.filter(
    (pessoa) =>
      pessoa.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pessoa.cpf.includes(searchTerm) ||
      pessoa.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSelectedPessoaFisicaDisplay = () => {
    if (selectedPessoaFisica) {
      return `${selectedPessoaFisica.nome} - ${selectedPessoaFisica.cpf}`;
    }
    return "Selecionar pessoa física...";
  };

  const getSelectedFilialDisplay = () => {
    const filial = filiais.find((f) => f.id === formData.filialId);
    return filial ? filial.nome : "Selecionar filial...";
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-secondary-200/50">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-secondary-900">
                {initialData ? "Editar Parceiro" : "Novo Parceiro"}
              </h2>
              <p className="text-sm text-secondary-600">
                {initialData
                  ? "Atualize as informações do parceiro"
                  : "Preencha os dados para cadastrar um novo parceiro"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {onBackToList && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onBackToList}
                className="flex items-center space-x-2 px-4 py-2 text-secondary-600 hover:text-secondary-800 hover:bg-secondary-50 rounded-lg transition-all duration-200"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar à Lista</span>
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCancel}
              className="p-2 text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100 rounded-lg transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Pessoa Física Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-secondary-700">
              Pessoa Física *
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPessoaFisicaSelector(true)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 bg-white border rounded-xl text-left transition-all duration-200",
                  errors.pessoaFisicaId
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                    : "border-secondary-200 hover:border-secondary-300 focus:border-primary-500 focus:ring-primary-500/20",
                  selectedPessoaFisica
                    ? "text-secondary-900"
                    : "text-secondary-500"
                )}
              >
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-secondary-400" />
                  <span>{getSelectedPessoaFisicaDisplay()}</span>
                </div>
                <ChevronDown className="w-5 h-5 text-secondary-400" />
              </button>
              {errors.pessoaFisicaId && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.pessoaFisicaId}
                </p>
              )}
            </div>
          </div>

          {/* Filial Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-secondary-700">
              Filial *
            </label>
            <div className="relative">
              <select
                value={formData.filialId}
                onChange={(e) =>
                  handleInputChange("filialId", parseInt(e.target.value))
                }
                className={cn(
                  "w-full px-4 py-3 bg-white border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200",
                  errors.filialId
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                    : "border-secondary-200 focus:border-primary-500 focus:ring-primary-500/20"
                )}
                disabled={loadingFiliais}
              >
                <option value={0}>Selecionar filial...</option>
                {filiais.map((filial) => (
                  <option key={filial.id} value={filial.id}>
                    {filial.nome}
                  </option>
                ))}
              </select>
              <Building className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400 pointer-events-none" />
              {errors.filialId && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.filialId}
                </p>
              )}
            </div>
          </div>

          {/* OAB */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-secondary-700">
              OAB
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.oab}
                onChange={(e) => handleInputChange("oab", e.target.value)}
                placeholder="Ex: SP123456"
                maxLength={20}
                className={cn(
                  "w-full pl-12 pr-4 py-3 bg-white border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200",
                  errors.oab
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                    : "border-secondary-200 focus:border-primary-500 focus:ring-primary-500/20"
                )}
              />
              <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
              {errors.oab && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.oab}
                </p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-secondary-700">
              Email
            </label>
            <div className="relative">
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="exemplo@email.com"
                className={cn(
                  "w-full pl-12 pr-4 py-3 bg-white border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200",
                  errors.email
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                    : "border-secondary-200 focus:border-primary-500 focus:ring-primary-500/20"
                )}
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.email}
                </p>
              )}
            </div>
          </div>

          {/* Telefone */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-secondary-700">
              Telefone
            </label>

            <div className="relative">
              <input
                type="tel"
                value={formData.telefone}
                onChange={(e) => handleInputChange("telefone", e.target.value)}
                placeholder="(11) 99999-9999"
                className={cn(
                  "w-full pl-12 pr-4 py-3 bg-white border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200",
                  errors.telefone
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                    : "border-secondary-200 focus:border-primary-500 focus:ring-primary-500/20"
                )}
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              {errors.telefone && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.telefone}
                </p>
              )}
            </div>
          </div>

          {/* Selected Pessoa Fisica Details */}
          {selectedPessoaFisica && (
            <div className="bg-secondary-50 rounded-xl p-4 space-y-3">
              <h4 className="font-medium text-secondary-900 flex items-center">
                <User className="w-4 h-4 mr-2" />
                Dados da Pessoa Física Selecionada
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-secondary-600">Nome:</span>
                  <span className="ml-2 text-secondary-900">
                    {selectedPessoaFisica.nome}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-secondary-600">CPF:</span>
                  <span className="ml-2 text-secondary-900">
                    {selectedPessoaFisica.cpf}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-secondary-600">Email:</span>
                  <span className="ml-2 text-secondary-900">
                    {formData.email ||
                      selectedPessoaFisica.email ||
                      "Não informado"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-secondary-600">
                    Telefone:
                  </span>
                  <span className="ml-2 text-secondary-900">
                    {formData.telefone ||
                      selectedPessoaFisica.telefone1 ||
                      "Não informado"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-secondary-200/50">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onCancel}
              className="px-6 py-3 text-secondary-700 bg-secondary-100 hover:bg-secondary-200 rounded-xl font-medium transition-all duration-200"
            >
              Cancelar
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl font-medium shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>{initialData ? "Atualizar" : "Cadastrar"}</span>
                </>
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>

      {/* Pessoa Física Selector Modal */}
      {showPessoaFisicaSelector && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-secondary-200/50">
              <h3 className="text-lg font-semibold text-secondary-900">
                Selecionar Pessoa Física
              </h3>
              <button
                onClick={() => setShowPessoaFisicaSelector(false)}
                className="p-2 text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100 rounded-lg transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Search Controls */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar por nome, CPF ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-secondary-50 border border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Buscar por CPF"
                    value={cpfSearch}
                    onChange={(e) => setCpfSearch(e.target.value)}
                    className="px-4 py-3 bg-secondary-50 border border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={handleBuscarPorCpf}
                    disabled={cpfSearch.length < 11}
                    className="px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Buscar
                  </button>
                </div>
              </div>

              {/* Create New Button */}
              {onNavigateToPessoaFisica && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={onNavigateToPessoaFisica}
                    className="flex items-center space-x-2 px-4 py-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg font-medium transition-all duration-200"
                  >
                    <Users className="w-4 h-4" />
                    <span>Cadastrar Nova Pessoa Física</span>
                  </button>
                </div>
              )}
            </div>

            {/* Pessoas List */}
            <div className="max-h-96 overflow-y-auto">
              {loadingPessoas ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                </div>
              ) : filteredPessoasFisicas.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                    Nenhuma pessoa encontrada
                  </h3>
                  <p className="text-secondary-600">
                    Tente ajustar os termos de busca
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-secondary-200/50">
                  {filteredPessoasFisicas.map((pessoa) => (
                    <motion.button
                      key={pessoa.id}
                      whileHover={{ backgroundColor: "#f8fafc" }}
                      onClick={() => handlePessoaFisicaSelect(pessoa)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary-50 transition-all duration-200"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-white">
                            {pessoa.nome.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-secondary-900">
                            {pessoa.nome}
                          </h4>
                          <div className="flex items-center space-x-4 text-sm text-secondary-600">
                            <span>{pessoa.cpf}</span>
                            <span>{pessoa.email}</span>
                          </div>
                        </div>
                      </div>
                      <ChevronDown className="w-5 h-5 text-secondary-400 transform rotate-[-90deg]" />
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Error Dialog */}
      <ErrorDialog
        isOpen={showErrorDialog}
        onClose={() => setShowErrorDialog(false)}
        title="Erro ao salvar parceiro"
        message="Ocorreu um erro ao tentar salvar o parceiro. Verifique os dados e tente novamente."
      />
    </>
  );
}
