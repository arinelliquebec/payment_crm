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
  onSubmit: (
    data: CreateParceiroDTO | UpdateParceiroDTO
  ) => Promise<boolean | { success: boolean; error?: string }>;
  onCancel: () => void;
  onBackToList?: () => void;
  onNavigateToPessoaFisica?: () => void;
  loading?: boolean;
  externalError?: string | null;
}

export default function ParceiroForm({
  initialData,
  onSubmit,
  onCancel,
  onBackToList,
  onNavigateToPessoaFisica,
  loading = false,
  externalError = null,
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
  const [apiErrorMessage, setApiErrorMessage] = useState<string | null>(null);
  const [selectedPessoaFisica, setSelectedPessoaFisica] =
    useState<PessoaFisica | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        pessoaFisicaId: initialData.pessoaFisicaId || 0,
        filialId: initialData.filialId || 0,
        oab: initialData.oab || "",
        email:
          initialData.email || initialData.pessoaFisica?.emailEmpresarial || "",
        telefone:
          initialData.telefone || initialData.pessoaFisica?.telefone1 || "",
      });
      setSelectedPessoaFisica(initialData.pessoaFisica || null);
    }
  }, [initialData]);

  // Filiais são carregadas automaticamente pelo hook useFiliais
  // Pessoas físicas são carregadas sob demanda quando o modal é aberto

  // Busca automática com debounce quando o usuário digita
  useEffect(() => {
    if (!searchTerm || searchTerm.length < 3 || !showPessoaFisicaSelector) {
      // Só busca se tiver 3+ caracteres e o modal estiver aberto
      return;
    }

    const timer = setTimeout(() => {
      console.log("🔍 Buscando pessoa física:", searchTerm);
      fetchPessoasFisicas(searchTerm, 50);
    }, 500); // Debounce de 500ms

    return () => clearTimeout(timer);
  }, [searchTerm, showPessoaFisicaSelector, fetchPessoasFisicas]);

  // Carregar algumas pessoas quando abrir o modal (se não houver busca)
  useEffect(() => {
    if (showPessoaFisicaSelector && pessoasFisicas.length === 0) {
      console.log("🔍 Carregando pessoas físicas iniciais (limite: 20)");
      fetchPessoasFisicas("", 20);
    }
  }, [showPessoaFisicaSelector]);

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
    setApiErrorMessage(null);

    if (!validateForm()) {
      return;
    }

    try {
      const submitData = initialData
        ? ({ ...formData, id: initialData.id } as UpdateParceiroDTO)
        : formData;

      const result = await onSubmit(submitData);

      // Handle both old (boolean) and new ({ success, error }) return types
      const success = typeof result === "boolean" ? result : result?.success;
      const errorMsg = typeof result === "object" ? result?.error : null;

      if (success) {
        onCancel();
      } else if (errorMsg) {
        setApiErrorMessage(errorMsg);
      }
    } catch (error: any) {
      console.error("Erro ao salvar parceiro:", error);
      const errorMessage =
        error?.message ||
        "Erro ao salvar parceiro. Verifique os dados e tente novamente.";
      setApiErrorMessage(errorMessage);
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
    handleInputChange("email", pessoa.emailEmpresarial || "");
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

  // ✅ REMOVIDO FILTRO CLIENT-SIDE - Backend já filtra os dados otimizadamente
  // Os dados vêm pré-filtrados do endpoint /buscar
  const filteredPessoasFisicas = pessoasFisicas;

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
        className="bg-neutral-900/95 backdrop-blur-xl rounded-2xl shadow-xl border border-neutral-800 max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl">
              <Scale className="w-6 h-6 text-neutral-900" />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                {initialData ? "Editar Parceiro" : "Novo Parceiro"}
              </h2>
              <p className="text-sm text-neutral-400">
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
                className="flex items-center space-x-2 px-4 py-2 text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800 border border-neutral-700 rounded-lg transition-all duration-200"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar à Lista</span>
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCancel}
              className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 border border-transparent hover:border-red-500/30"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Alert */}
          {(apiErrorMessage || externalError) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start space-x-3"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-red-300">
                  Erro ao salvar parceiro
                </h4>
                <p className="text-sm text-red-200 mt-1">
                  {apiErrorMessage || externalError}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setApiErrorMessage(null)}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* Pessoa Física Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-300">
              Pessoa Física *
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPessoaFisicaSelector(true)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 bg-neutral-900/50 border rounded-xl text-left transition-all duration-200",
                  errors.pessoaFisicaId
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                    : "border-neutral-700 hover:border-neutral-600 focus:border-amber-500/50 focus:ring-amber-500/20",
                  selectedPessoaFisica ? "text-neutral-100" : "text-neutral-500"
                )}
              >
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-neutral-500" />
                  <span>{getSelectedPessoaFisicaDisplay()}</span>
                </div>
                <ChevronDown className="w-5 h-5 text-neutral-500" />
              </button>
              {errors.pessoaFisicaId && (
                <p className="mt-1 text-sm text-red-400 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.pessoaFisicaId}
                </p>
              )}
            </div>
          </div>

          {/* Filial Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-300">
              Filial *
            </label>
            <div className="relative">
              <select
                value={formData.filialId}
                onChange={(e) =>
                  handleInputChange("filialId", parseInt(e.target.value))
                }
                className={cn(
                  "w-full px-4 py-3 pr-10 bg-neutral-900/50 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 text-neutral-100 appearance-none cursor-pointer",
                  errors.filialId
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                    : "border-neutral-700 focus:border-amber-500/50 focus:ring-amber-500/20",
                  "[&>option]:bg-neutral-900 [&>option]:text-neutral-200",
                  loadingFiliais && "opacity-50 cursor-wait"
                )}
                disabled={loadingFiliais}
              >
                <option value={0} className="text-neutral-500">
                  {loadingFiliais ? "Carregando filiais..." : "Selecionar filial..."}
                </option>
                {filiais.map((filial) => (
                  <option
                    key={filial.id}
                    value={filial.id}
                    className="bg-neutral-900 text-neutral-200"
                  >
                    {filial.nome}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-500 pointer-events-none" />
              {errors.filialId && (
                <p className="mt-1 text-sm text-red-400 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.filialId}
                </p>
              )}
              {filiaisError && !loadingFiliais && (
                <div className="mt-2 flex items-center justify-between p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-sm text-red-400">Erro ao carregar filiais</p>
                  <button
                    type="button"
                    onClick={() => fetchFiliais()}
                    className="text-sm text-amber-400 hover:text-amber-300 font-medium"
                  >
                    Tentar novamente
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* OAB */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-300">
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
                  "w-full pl-12 pr-4 py-3 bg-neutral-900/50 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 text-neutral-100 placeholder:text-neutral-500",
                  errors.oab
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                    : "border-neutral-700 focus:border-amber-500/50 focus:ring-amber-500/20"
                )}
              />
              <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-500" />
              {errors.oab && (
                <p className="mt-1 text-sm text-red-400 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.oab}
                </p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-300">
              Email
            </label>
            <div className="relative">
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="exemplo@email.com"
                className={cn(
                  "w-full pl-12 pr-4 py-3 bg-neutral-900/50 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 text-neutral-100 placeholder:text-neutral-500",
                  errors.email
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                    : "border-neutral-700 focus:border-amber-500/50 focus:ring-amber-500/20"
                )}
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-500"
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
                <p className="mt-1 text-sm text-red-400 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.email}
                </p>
              )}
            </div>
          </div>

          {/* Telefone */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-300">
              Telefone
            </label>

            <div className="relative">
              <input
                type="tel"
                value={formData.telefone}
                onChange={(e) => handleInputChange("telefone", e.target.value)}
                placeholder="(11) 99999-9999"
                className={cn(
                  "w-full pl-12 pr-4 py-3 bg-neutral-900/50 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 text-neutral-100 placeholder:text-neutral-500",
                  errors.telefone
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                    : "border-neutral-700 focus:border-amber-500/50 focus:ring-amber-500/20"
                )}
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-500"
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
                <p className="mt-1 text-sm text-red-400 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.telefone}
                </p>
              )}
            </div>
          </div>

          {/* Selected Pessoa Fisica Details */}
          {selectedPessoaFisica && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 space-y-3">
              <h4 className="font-medium text-green-300 flex items-center">
                <User className="w-4 h-4 mr-2" />
                Dados da Pessoa Física Selecionada
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-green-400">Nome:</span>
                  <span className="ml-2 text-green-200">
                    {selectedPessoaFisica.nome}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-green-400">CPF:</span>
                  <span className="ml-2 text-green-200">
                    {selectedPessoaFisica.cpf}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-green-400">Email:</span>
                  <span className="ml-2 text-green-200">
                    {formData.email ||
                      selectedPessoaFisica.emailEmpresarial ||
                      "Não informado"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-green-400">Telefone:</span>
                  <span className="ml-2 text-green-200">
                    {formData.telefone ||
                      selectedPessoaFisica.telefone1 ||
                      "Não informado"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-neutral-800">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onCancel}
              className="px-6 py-3 text-neutral-300 bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700 rounded-xl font-medium transition-all duration-200"
            >
              Cancelar
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-neutral-900 rounded-xl font-medium shadow-lg shadow-amber-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="bg-neutral-900/95 backdrop-blur-xl rounded-2xl shadow-xl border border-neutral-800 max-w-4xl w-full max-h-[80vh] overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-neutral-800">
              <h3 className="text-lg font-semibold text-neutral-100">
                Selecionar Pessoa Física
              </h3>
              <button
                onClick={() => setShowPessoaFisicaSelector(false)}
                className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 border border-transparent hover:border-red-500/30"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Search Controls */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar por nome, CPF ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-neutral-900/50 border border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent transition-all duration-200 text-neutral-100 placeholder:text-neutral-500"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Buscar por CPF"
                    value={cpfSearch}
                    onChange={(e) => setCpfSearch(e.target.value)}
                    className="px-4 py-3 bg-neutral-900/50 border border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent transition-all duration-200 text-neutral-100 placeholder:text-neutral-500"
                  />
                  <button
                    type="button"
                    onClick={handleBuscarPorCpf}
                    disabled={cpfSearch.length < 11}
                    className="px-4 py-3 bg-amber-500 hover:bg-amber-600 text-neutral-900 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className="flex items-center space-x-2 px-4 py-2 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg font-medium transition-all duration-200 border border-transparent hover:border-amber-500/30"
                  >
                    <Users className="w-4 h-4" />
                    <span>Cadastrar Nova Pessoa Física</span>
                  </button>
                </div>
              )}
            </div>

            {/* Pessoas List */}
            <div className="max-h-96 overflow-y-auto bg-neutral-900/30">
              {loadingPessoas ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                </div>
              ) : filteredPessoasFisicas.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-neutral-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-neutral-200 mb-2">
                    Nenhuma pessoa encontrada
                  </h3>
                  <p className="text-neutral-400">
                    Tente ajustar os termos de busca
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-700">
                  {filteredPessoasFisicas.map((pessoa) => (
                    <motion.button
                      key={pessoa.id}
                      whileHover={{ backgroundColor: "rgba(38, 38, 38, 0.5)" }}
                      onClick={() => handlePessoaFisicaSelect(pessoa)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-neutral-800/50 transition-all duration-200"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-neutral-900">
                            {pessoa.nome.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-neutral-100">
                            {pessoa.nome}
                          </h4>
                          <div className="flex items-center space-x-4 text-sm text-neutral-400">
                            <span>{pessoa.cpf}</span>
                            <span>{pessoa.emailEmpresarial}</span>
                          </div>
                        </div>
                      </div>
                      <ChevronDown className="w-5 h-5 text-neutral-500 transform rotate-[-90deg]" />
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
