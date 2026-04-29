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
    status: "ativo",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPessoaFisicaSelector, setShowPessoaFisicaSelector] =
    useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [cpfSearch, setCpfSearch] = useState("");
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [selectedPessoaFisica, setSelectedPessoaFisica] =
    useState<PessoaFisica | null>(null);

  // Função para formatar data no formato brasileiro
  const formatDateBR = (dateString: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("pt-BR");
    } catch (error) {
      return "";
    }
  };

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
        status: initialData.status || "ativo",
      });

      // Se estiver editando e tiver uma pessoa física vinculada, definir ela como selecionada
      if (initialData.pessoaFisica) {
        setSelectedPessoaFisica(initialData.pessoaFisica);
      }
    }
  }, [initialData]);

  // Carrega algumas pessoas físicas quando abrir o modal (se não houver registros)
  useEffect(() => {
    if (showPessoaFisicaSelector && pessoasFisicas.length === 0) {
      console.log("🔍 Carregando pessoas físicas iniciais (limite: 20)");
      fetchPessoasFisicas("", 20);
    }
  }, [showPessoaFisicaSelector]);

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

  const selectPessoaFisica = (pessoa: PessoaFisica) => {
    setFormData((prev) => ({
      ...prev,
      pessoaFisicaId: pessoa.id,
      nome: pessoa.nome || "",
      email: pessoa.emailEmpresarial || "",
      telefone1: pessoa.telefone1 || "",
      telefone2: pessoa.telefone2 || "",
    }));
    setSelectedPessoaFisica(pessoa);
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

  // ✅ REMOVIDO FILTRO CLIENT-SIDE - Backend já filtra os dados otimizadamente
  // Os dados vêm pré-filtrados do endpoint /buscar
  const filteredPessoasFisicas = pessoasFisicas;

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
        className="bg-neutral-900/95 backdrop-blur-xl rounded-2xl shadow-xl border border-neutral-800 max-w-2xl w-full mx-auto"
      >
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg">
              <User className="w-6 h-6 text-neutral-900" />
            </div>
            <div>
              <h2 className="text-xl font-semibold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                {initialData ? "Editar Consultor" : "Novo Consultor"}
              </h2>
              <p className="text-sm text-neutral-400">
                {initialData
                  ? "Atualize as informações do consultor"
                  : "Preencha as informações do novo consultor"}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors duration-200 border border-transparent hover:border-red-500/30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Seletor de Pessoa Física */}
          <div className="bg-neutral-800/50 border border-neutral-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-semibold text-neutral-100">
                  Selecionar Pessoa Física Existente *
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  // NÃO carregar tudo automaticamente - usar debounce e lazy load
                  setShowPessoaFisicaSelector(!showPessoaFisicaSelector);
                }}
                className="flex items-center space-x-1 text-amber-400 hover:text-amber-300 text-sm font-medium"
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

            <div className="mb-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-sm text-amber-300">
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
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-amber-300 mb-2">
                    Buscar por CPF
                  </h4>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={cpfSearch}
                      onChange={(e) => setCpfSearch(e.target.value)}
                      placeholder="Digite o CPF..."
                      className="flex-1 px-3 py-2 bg-neutral-900/50 border border-neutral-700 text-neutral-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent placeholder:text-neutral-500"
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleBuscarPorCpf()
                      }
                    />
                    <button
                      type="button"
                      onClick={handleBuscarPorCpf}
                      disabled={loadingPessoas || !cpfSearch.trim()}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-neutral-900 rounded-lg font-medium transition-colors duration-200 disabled:cursor-not-allowed"
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
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 w-4 h-4" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por nome, email ou CPF..."
                    className="w-full pl-12 pr-4 py-2 bg-neutral-900/50 border border-neutral-700 text-neutral-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent placeholder:text-neutral-500"
                  />
                </div>

                <div className="max-h-60 overflow-y-auto border border-neutral-700 rounded-lg bg-neutral-900/30">
                  {loadingPessoas ? (
                    <div className="p-4 text-center text-neutral-400">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-400" />
                      Carregando pessoas físicas...
                    </div>
                  ) : pessoasError ? (
                    <div className="p-4 text-center text-red-400">
                      <AlertCircle className="w-5 h-5 mx-auto mb-2" />
                      Erro ao carregar pessoas físicas
                      <p className="text-sm text-red-400 mt-1">
                        {pessoasError}
                      </p>
                    </div>
                  ) : filteredPessoasFisicas.length === 0 ? (
                    <div className="p-4 text-center text-neutral-400">
                      {searchTerm
                        ? "Nenhuma pessoa encontrada"
                        : "Nenhuma pessoa física cadastrada"}
                    </div>
                  ) : (
                    <div className="divide-y divide-neutral-700">
                      {filteredPessoasFisicas.map((pessoa) => (
                        <button
                          key={pessoa.id}
                          type="button"
                          onClick={() => selectPessoaFisica(pessoa)}
                          className="w-full p-3 text-left hover:bg-neutral-800/50 transition-colors duration-200"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-neutral-100">
                                {pessoa.nome}
                              </p>
                              <p className="text-sm text-neutral-400">
                                {pessoa.emailEmpresarial}
                              </p>
                              {pessoa.cpf && (
                                <p className="text-xs text-neutral-500">
                                  CPF: {pessoa.cpf}
                                </p>
                              )}
                            </div>
                            <div className="text-amber-400">
                              <User className="w-4 h-4" />
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {formData.pessoaFisicaId > 0 && selectedPessoaFisica && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-green-400 font-medium mb-2">
                          Pessoa selecionada:
                        </p>
                        <div className="space-y-1">
                          <p className="text-sm text-green-300 font-semibold">
                            {selectedPessoaFisica.nome}
                          </p>
                          <p className="text-xs text-green-400">
                            Email: {selectedPessoaFisica.emailEmpresarial}
                          </p>
                          {selectedPessoaFisica.cpf && (
                            <p className="text-xs text-green-400">
                              CPF: {selectedPessoaFisica.cpf}
                            </p>
                          )}
                          {selectedPessoaFisica.dataNascimento && (
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3 text-green-400" />
                              <p className="text-xs text-green-400">
                                Data de Nascimento:{" "}
                                {formatDateBR(
                                  selectedPessoaFisica.dataNascimento
                                )}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Nome Completo *
                {formData.pessoaFisicaId > 0 && (
                  <span className="ml-2 text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded-full border border-green-500/30">
                    Preenchido automaticamente
                  </span>
                )}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 w-5 h-5" />
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, nome: e.target.value }))
                  }
                  className={cn(
                    "w-full pl-12 pr-4 py-3 bg-neutral-900/50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent transition-all duration-200 text-neutral-100 placeholder:text-neutral-500",
                    errors.nome
                      ? "border-red-500 focus:ring-red-500/50"
                      : formData.pessoaFisicaId > 0
                      ? "border-green-500/50 bg-green-500/10"
                      : "border-neutral-700"
                  )}
                  placeholder="Nome completo"
                />
              </div>
              {errors.nome && (
                <p className="mt-1 text-sm text-red-400 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.nome}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Email *
                {formData.pessoaFisicaId > 0 && (
                  <span className="ml-2 text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded-full border border-green-500/30">
                    Preenchido automaticamente
                  </span>
                )}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 w-5 h-5" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className={cn(
                    "w-full pl-12 pr-4 py-3 bg-neutral-900/50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent transition-all duration-200 text-neutral-100 placeholder:text-neutral-500",
                    errors.email
                      ? "border-red-500 focus:ring-red-500/50"
                      : formData.pessoaFisicaId > 0
                      ? "border-green-500/50 bg-green-500/10"
                      : "border-neutral-700"
                  )}
                  placeholder="email@exemplo.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-400 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* OAB */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                OAB
              </label>
              <input
                type="text"
                value={formData.oab}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, oab: e.target.value }))
                }
                className="w-full px-4 py-3 bg-neutral-900/50 border border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent transition-all duration-200 text-neutral-100 placeholder:text-neutral-500"
                placeholder="123456/SP"
              />
            </div>

            {/* Telefone 1 */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Telefone Principal *
                {formData.pessoaFisicaId > 0 && (
                  <span className="ml-2 text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded-full border border-green-500/30">
                    Preenchido automaticamente
                  </span>
                )}
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 w-5 h-5" />
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
                    "w-full pl-12 pr-4 py-3 bg-neutral-900/50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent transition-all duration-200 text-neutral-100 placeholder:text-neutral-500",
                    errors.telefone1
                      ? "border-red-500 focus:ring-red-500/50"
                      : formData.pessoaFisicaId > 0
                      ? "border-green-500/50 bg-green-500/10"
                      : "border-neutral-700"
                  )}
                  placeholder="(11) 99999-9999"
                />
              </div>
              {errors.telefone1 && (
                <p className="mt-1 text-sm text-red-400 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.telefone1}
                </p>
              )}
            </div>

            {/* Telefone 2 */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Telefone Secundário
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
                  "w-full px-4 py-3 bg-neutral-900/50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent transition-all duration-200 text-neutral-100 placeholder:text-neutral-500",
                  formData.pessoaFisicaId > 0
                    ? "border-green-500/50 bg-green-500/10"
                    : "border-neutral-700"
                )}
                placeholder="(11) 88888-8888"
              />
            </div>

            {/* Filial */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Filial *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 w-5 h-5" />
                <select
                  value={formData.filialId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      filialId: parseInt(e.target.value) || 0,
                    }))
                  }
                  className={cn(
                    "w-full pl-12 pr-4 py-3 bg-neutral-900/50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent transition-all duration-200 appearance-none text-neutral-100",
                    errors.filialId
                      ? "border-red-500 focus:ring-red-500/50"
                      : "border-neutral-700",
                    "[&>option]:bg-neutral-900 [&>option]:text-neutral-200"
                  )}
                  disabled={loadingFiliais}
                >
                  <option value={0} className="text-neutral-500">
                    Selecione uma filial
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
                {loadingFiliais && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  </div>
                )}
              </div>
              {filiaisError && (
                <p className="mt-1 text-sm text-red-400 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Erro ao carregar filiais: {filiaisError}
                </p>
              )}
              {errors.filialId && (
                <p className="mt-1 text-sm text-red-400 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.filialId}
                </p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
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
                className="w-full px-4 py-3 bg-neutral-900/50 border border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent transition-all duration-200 text-neutral-100 [&>option]:bg-neutral-900 [&>option]:text-neutral-200"
              >
                <option
                  value="ativo"
                  className="bg-neutral-900 text-neutral-200"
                >
                  Ativo
                </option>
                <option
                  value="inativo"
                  className="bg-neutral-900 text-neutral-200"
                >
                  Inativo
                </option>
                <option
                  value="ferias"
                  className="bg-neutral-900 text-neutral-200"
                >
                  Férias
                </option>
                <option
                  value="licenca"
                  className="bg-neutral-900 text-neutral-200"
                >
                  Licença
                </option>
              </select>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-neutral-800">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 text-neutral-300 bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700 rounded-xl font-medium transition-colors duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-900 rounded-xl font-medium transition-colors duration-200 shadow-lg shadow-amber-500/30"
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
