// src/components/forms/ConsultorForm.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Award,
  Calendar,
  Save,
  Loader2,
  AlertCircle,
  ChevronDown,
  Search,
  Users,
  ArrowLeft,
} from "lucide-react";
import {
  Consultor,
  CreateConsultorDTO,
  UpdateConsultorDTO,
  PessoaFisica,
} from "@/types/api";
import { cn } from "@/lib/utils";
import { usePessoasFisicas } from "@/hooks/usePessoasFisicas";
import { useFiliais } from "@/hooks/useFiliais";
import ErrorDialog from "@/components/ErrorDialog";

interface ConsultorFormProps {
  initialData?: Consultor | null;
  onSubmit: (data: CreateConsultorDTO | UpdateConsultorDTO) => Promise<boolean>;
  onCancel: () => void;
  onBackToList?: () => void;
  onNavigateToPessoaFisica?: () => void;
  loading?: boolean;
}

export default function ConsultorForm({
  initialData,
  onSubmit,
  onCancel,
  onBackToList,
  onNavigateToPessoaFisica,
  loading = false,
}: ConsultorFormProps) {
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

  const [formData, setFormData] = useState<CreateConsultorDTO>({
    pessoaFisicaId: 0,
    filialId: 0,
    nome: "",
    email: "",
    oab: "",
    telefone1: "",
    telefone2: "",
    especialidades: [],
    status: "ativo",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newEspecialidade, setNewEspecialidade] = useState("");
  const [showPessoaFisicaSelector, setShowPessoaFisicaSelector] =
    useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [cpfSearch, setCpfSearch] = useState("");
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        pessoaFisicaId: initialData.pessoaFisicaId || 0,
        filialId: initialData.filialId || 0,
        nome: initialData.nome || "",
        email: initialData.email || "",
        oab: initialData.oab || "",
        telefone1: initialData.telefone1 || "",
        telefone2: initialData.telefone2 || "",
        especialidades: initialData.especialidades || [],
        status: initialData.status || "ativo",
      });
    }
  }, [initialData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validar se uma pessoa física foi selecionada
    if (!formData.pessoaFisicaId || formData.pessoaFisicaId === 0) {
      setShowErrorDialog(true);
      return false;
    }

    if (!formData.nome?.trim()) {
      newErrors.nome = "Nome é obrigatório";
    }

    if (!formData.email?.trim()) {
      newErrors.email = "Email é obrigatório";
    } else if (!/\S+@\S+\.\S+/.test(formData.email || "")) {
      newErrors.email = "Email inválido";
    }

    if (!formData.telefone1?.trim()) {
      newErrors.telefone1 = "Telefone é obrigatório";
    }

    if (!formData.filialId || formData.filialId === 0) {
      newErrors.filialId = "Filial é obrigatória";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const data = initialData
      ? ({ ...formData, id: initialData.id } as UpdateConsultorDTO)
      : formData;

    const success = await onSubmit(data);
    if (success) {
      onCancel();
    }
  };

  const addEspecialidade = () => {
    if (
      newEspecialidade.trim() &&
      !formData.especialidades?.includes(newEspecialidade.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        especialidades: [
          ...(prev.especialidades || []),
          newEspecialidade.trim(),
        ],
      }));
      setNewEspecialidade("");
    }
  };

  const removeEspecialidade = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      especialidades:
        prev.especialidades?.filter((_: string, i: number) => i !== index) ||
        [],
    }));
  };

  const selectPessoaFisica = (pessoa: PessoaFisica) => {
    setFormData((prev) => ({
      ...prev,
      pessoaFisicaId: pessoa.id,
      nome: pessoa.nome || "",
      email: pessoa.email || "",
      telefone1: pessoa.telefone1 || "",
      telefone2: pessoa.telefone2 || "",
    }));
    setShowPessoaFisicaSelector(false);
    setSearchTerm("");
    setCpfSearch("");
  };

  const handleBuscarPorCpf = async () => {
    if (cpfSearch.trim()) {
      const pessoa = await buscarPorCpf(cpfSearch.trim());
      if (pessoa) {
        selectPessoaFisica(pessoa);
      }
    }
  };

  const filteredPessoasFisicas = pessoasFisicas.filter(
    (pessoa) =>
      pessoa.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pessoa.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pessoa.cpf?.includes(searchTerm)
  );

  return (
    <>
      <ErrorDialog
        isOpen={showErrorDialog}
        onClose={() => setShowErrorDialog(false)}
        title="Pessoa Física Necessária"
        message="Para cadastrar um consultor, é necessário selecionar uma pessoa física existente. Você pode cadastrar uma nova pessoa física e depois retornar para criar o consultor."
        primaryAction={{
          label: "Cadastrar Pessoa Física",
          onClick: () => {
            setShowErrorDialog(false);
            if (onNavigateToPessoaFisica) {
              onNavigateToPessoaFisica();
            } else if (onBackToList) {
              onBackToList();
            }
          },
          variant: "primary",
        }}
        secondaryAction={{
          label: "Voltar aos Consultores",
          onClick: () => {
            setShowErrorDialog(false);
            if (onBackToList) onBackToList();
          },
          variant: "secondary",
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-auto"
      >
        <div className="flex items-center justify-between p-6 border-b border-secondary-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <User className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-secondary-900">
                {initialData ? "Editar Consultor" : "Novo Consultor"}
              </h2>
              <p className="text-sm text-secondary-600">
                {initialData
                  ? "Atualize as informações do consultor"
                  : "Preencha as informações do novo consultor"}
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
          {/* Seletor de Pessoa Física */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-semibold text-blue-900">
                  Selecionar Pessoa Física Existente *
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!showPessoaFisicaSelector) {
                    fetchPessoasFisicas();
                  }
                  setShowPessoaFisicaSelector(!showPessoaFisicaSelector);
                }}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                <span>{showPessoaFisicaSelector ? "Ocultar" : "Mostrar"}</span>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 transition-transform duration-200",
                    showPessoaFisicaSelector && "rotate-180"
                  )}
                />
              </button>
            </div>

            <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <AlertCircle className="w-4 h-4 inline mr-2" />
                <strong>Obrigatório:</strong> Todo consultor deve estar
                associado a uma pessoa física.
                {!formData.pessoaFisicaId &&
                  " Selecione uma pessoa física abaixo para prosseguir."}
              </p>
            </div>

            {showPessoaFisicaSelector && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                {/* Busca por CPF */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-yellow-900 mb-2">
                    Buscar por CPF
                  </h4>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={cpfSearch}
                      onChange={(e) => setCpfSearch(e.target.value)}
                      placeholder="Digite o CPF..."
                      className="flex-1 px-3 py-2 border border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleBuscarPorCpf()
                      }
                    />
                    <button
                      type="button"
                      onClick={handleBuscarPorCpf}
                      disabled={loadingPessoas || !cpfSearch.trim()}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white rounded-lg font-medium transition-colors duration-200"
                    >
                      {loadingPessoas ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Buscar"
                      )}
                    </button>
                  </div>
                </div>

                {/* Busca geral */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por nome, email ou CPF..."
                    className="w-full pl-12 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="max-h-60 overflow-y-auto border border-secondary-200 rounded-lg">
                  {loadingPessoas ? (
                    <div className="p-4 text-center text-secondary-600">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                      Carregando pessoas físicas...
                    </div>
                  ) : pessoasError ? (
                    <div className="p-4 text-center text-red-600">
                      <AlertCircle className="w-5 h-5 mx-auto mb-2" />
                      Erro ao carregar pessoas físicas
                      <p className="text-sm text-red-500 mt-1">
                        {pessoasError}
                      </p>
                    </div>
                  ) : filteredPessoasFisicas.length === 0 ? (
                    <div className="p-4 text-center text-secondary-600">
                      {searchTerm
                        ? "Nenhuma pessoa encontrada"
                        : "Nenhuma pessoa física cadastrada"}
                    </div>
                  ) : (
                    <div className="divide-y divide-secondary-100">
                      {filteredPessoasFisicas.map((pessoa) => (
                        <button
                          key={pessoa.id}
                          type="button"
                          onClick={() => selectPessoaFisica(pessoa)}
                          className="w-full p-3 text-left hover:bg-blue-50 transition-colors duration-200"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-secondary-900">
                                {pessoa.nome}
                              </p>
                              <p className="text-sm text-secondary-600">
                                {pessoa.email}
                              </p>
                              {pessoa.cpf && (
                                <p className="text-xs text-secondary-500">
                                  CPF: {pessoa.cpf}
                                </p>
                              )}
                            </div>
                            <div className="text-blue-600">
                              <User className="w-4 h-4" />
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {formData.pessoaFisicaId > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-800">
                      <span className="font-medium">Pessoa selecionada:</span>{" "}
                      {formData.nome}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Nome Completo *
                {formData.pessoaFisicaId > 0 && (
                  <span className="ml-2 text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                    Preenchido automaticamente
                  </span>
                )}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5" />
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, nome: e.target.value }))
                  }
                  className={cn(
                    "w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200",
                    errors.nome
                      ? "border-red-300 focus:ring-red-500"
                      : formData.pessoaFisicaId > 0
                      ? "border-green-300 bg-green-50"
                      : "border-secondary-300"
                  )}
                  placeholder="Nome completo"
                />
              </div>
              {errors.nome && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.nome}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Email *
                {formData.pessoaFisicaId > 0 && (
                  <span className="ml-2 text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                    Preenchido automaticamente
                  </span>
                )}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className={cn(
                    "w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200",
                    errors.email
                      ? "border-red-300 focus:ring-red-500"
                      : formData.pessoaFisicaId > 0
                      ? "border-green-300 bg-green-50"
                      : "border-secondary-300"
                  )}
                  placeholder="email@exemplo.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* OAB */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                OAB
              </label>
              <input
                type="text"
                value={formData.oab}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, oab: e.target.value }))
                }
                className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                placeholder="123456/SP"
              />
            </div>

            {/* Telefone 1 */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Telefone Principal *
                {formData.pessoaFisicaId > 0 && (
                  <span className="ml-2 text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                    Preenchido automaticamente
                  </span>
                )}
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5" />
                <input
                  type="tel"
                  value={formData.telefone1}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      telefone1: e.target.value,
                    }))
                  }
                  className={cn(
                    "w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200",
                    errors.telefone1
                      ? "border-red-300 focus:ring-red-500"
                      : formData.pessoaFisicaId > 0
                      ? "border-green-300 bg-green-50"
                      : "border-secondary-300"
                  )}
                  placeholder="(11) 99999-9999"
                />
              </div>
              {errors.telefone1 && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.telefone1}
                </p>
              )}
            </div>

            {/* Telefone 2 */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Telefone Secundário
                {formData.pessoaFisicaId > 0 && (
                  <span className="ml-2 text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                    Preenchido automaticamente
                  </span>
                )}
              </label>
              <input
                type="tel"
                value={formData.telefone2}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    telefone2: e.target.value,
                  }))
                }
                className={cn(
                  "w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200",
                  formData.pessoaFisicaId > 0
                    ? "border-green-300 bg-green-50"
                    : "border-secondary-300"
                )}
                placeholder="(11) 88888-8888"
              />
            </div>

            {/* Filial */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Filial *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5" />
                <select
                  value={formData.filialId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      filialId: parseInt(e.target.value) || 0,
                    }))
                  }
                  className={cn(
                    "w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 appearance-none",
                    errors.filialId
                      ? "border-red-300 focus:ring-red-500"
                      : "border-secondary-300"
                  )}
                  disabled={loadingFiliais}
                >
                  <option value={0}>Selecione uma filial</option>
                  {filiais.map((filial) => (
                    <option key={filial.id} value={filial.id}>
                      {filial.nome}
                    </option>
                  ))}
                </select>
                {loadingFiliais && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-secondary-400" />
                  </div>
                )}
              </div>
              {filiaisError && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Erro ao carregar filiais: {filiaisError}
                </p>
              )}
              {errors.filialId && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.filialId}
                </p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: e.target.value as
                      | "ativo"
                      | "inativo"
                      | "ferias"
                      | "licenca",
                  }))
                }
                className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
                <option value="ferias">Férias</option>
                <option value="licenca">Licença</option>
              </select>
            </div>
          </div>

          {/* Especialidades */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Especialidades
            </label>
            <div className="space-y-3">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newEspecialidade}
                  onChange={(e) => setNewEspecialidade(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" &&
                    (e.preventDefault(), addEspecialidade())
                  }
                  className="flex-1 px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  placeholder="Adicionar especialidade"
                />
                <button
                  type="button"
                  onClick={addEspecialidade}
                  className="px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors duration-200"
                >
                  Adicionar
                </button>
              </div>
              {formData.especialidades &&
                formData.especialidades.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.especialidades?.map(
                      (esp: string, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                        >
                          {esp}
                          <button
                            type="button"
                            onClick={() => removeEspecialidade(index)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      )
                    )}
                  </div>
                )}
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
              <span>{loading ? "Salvando..." : "Salvar"}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </>
  );
}
