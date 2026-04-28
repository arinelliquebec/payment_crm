// src/components/forms/ClienteForm.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  X,
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  Save,
  Loader2,
  AlertCircle,
  DollarSign,
  FileText,
  Search,
} from "lucide-react";
import {
  Cliente,
  CreateClienteDTO,
  UpdateClienteDTO,
  PessoaFisica,
  PessoaJuridica,
} from "@/types/api";
import { cn } from "@/lib/utils";
import { usePessoasFisicas } from "@/hooks/usePessoasFisicas";
import { usePessoasJuridicas } from "@/hooks/usePessoasJuridicas";
import { useFiliais } from "@/hooks/useFiliais";

interface ClienteFormProps {
  initialData?: Cliente | null;
  onSubmit: (data: CreateClienteDTO | UpdateClienteDTO) => Promise<boolean>;
  onCancel: () => void;
  loading?: boolean;
}

export default function ClienteForm({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
}: ClienteFormProps) {
  const [formData, setFormData] = useState<CreateClienteDTO>({
    tipoPessoa: "Fisica",
    pessoaId: 0,
    filialId: 0,
    nome: "",
    razaoSocial: "",
    email: "",
    cpf: "",
    cnpj: "",
    telefone1: "",
    telefone2: "",
    tipo: "fisica",
    status: "ativo",
    segmento: "",
    valorContrato: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cpfSearch, setCpfSearch] = useState("");
  const [cnpjSearch, setCnpjSearch] = useState("");
  const [searchingCpf, setSearchingCpf] = useState(false);
  const [searchingCnpj, setSearchingCnpj] = useState(false);

  const { buscarPorCpf } = usePessoasFisicas();
  const { buscarPorCnpj } = usePessoasJuridicas();
  const {
    filiais,
    loading: loadingFiliais,
    error: errorFiliais,
  } = useFiliais();

  const handleBuscarPorCpf = async () => {
    if (!cpfSearch.trim()) return;

    setSearchingCpf(true);
    try {
      const pessoa = await buscarPorCpf(cpfSearch);
      if (pessoa) {
        setFormData((prev) => ({
          ...prev,
          tipoPessoa: "Fisica",
          pessoaId: pessoa.id,
          nome: pessoa.nome || "",
          email: pessoa.email || "",
          cpf: pessoa.cpf || "",
          telefone1: pessoa.telefone1 || "",
          telefone2: pessoa.telefone2 || "",
          tipo: "fisica",
        }));
      }
    } catch (error) {
      console.error("Erro ao buscar por CPF:", error);
    } finally {
      setSearchingCpf(false);
    }
  };

  const handleBuscarPorCnpj = async () => {
    if (!cnpjSearch.trim()) return;

    setSearchingCnpj(true);
    try {
      const pessoa = await buscarPorCnpj(cnpjSearch);
      if (pessoa) {
        setFormData((prev) => ({
          ...prev,
          tipoPessoa: "Juridica",
          pessoaId: pessoa.id,
          razaoSocial: pessoa.razaoSocial || "",
          email: pessoa.email || "",
          cnpj: pessoa.cnpj || "",
          telefone1: pessoa.telefone1 || "",
          telefone2: pessoa.telefone2 || "",
          tipo: "juridica",
        }));
      }
    } catch (error) {
      console.error("Erro ao buscar por CNPJ:", error);
    } finally {
      setSearchingCnpj(false);
    }
  };

  useEffect(() => {
    if (initialData) {
      setFormData({
        tipoPessoa: initialData.tipoPessoa || "Fisica",
        pessoaId:
          initialData.pessoaFisicaId || initialData.pessoaJuridicaId || 0,
        filialId: initialData.filialId || 0,
        nome: initialData.nome || "",
        razaoSocial: initialData.razaoSocial || "",
        email: initialData.email || "",
        cpf: initialData.cpf || "",
        cnpj: initialData.cnpj || "",
        telefone1: initialData.telefone1 || "",
        telefone2: initialData.telefone2 || "",
        tipo: initialData.tipo || "fisica",
        status: initialData.status || "ativo",
        segmento: initialData.segmento || "",
        valorContrato: initialData.valorContrato || 0,
      });
    }
  }, [initialData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.tipo === "fisica") {
      if (!formData.nome?.trim()) {
        newErrors.nome = "Nome é obrigatório para pessoa física";
      }
      if (!formData.cpf?.trim()) {
        newErrors.cpf = "CPF é obrigatório para pessoa física";
      }
    } else {
      if (!formData.razaoSocial?.trim()) {
        newErrors.razaoSocial =
          "Razão social é obrigatória para pessoa jurídica";
      }
      if (!formData.cnpj?.trim()) {
        newErrors.cnpj = "CNPJ é obrigatório para pessoa jurídica";
      }
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
      ? ({ ...formData, id: initialData.id } as UpdateClienteDTO)
      : formData;

    const success = await onSubmit(data);
    if (success) {
      onCancel();
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const parseCurrency = (value: string) => {
    return Number(value.replace(/\D/g, "")) / 100;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-2xl shadow-xl max-w-4xl w-full mx-auto"
    >
      <div className="flex items-center justify-between p-6 border-b border-secondary-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg">
            {formData.tipo === "fisica" ? (
              <User className="w-6 h-6 text-green-600" />
            ) : (
              <Building2 className="w-6 h-6 text-green-600" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-secondary-900">
              {initialData ? "Editar Cliente" : "Novo Cliente"}
            </h2>
            <p className="text-sm text-secondary-600">
              {initialData
                ? "Atualize as informações do cliente"
                : "Preencha as informações do novo cliente"}
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
        {/* Tipo de Cliente */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Tipo de Cliente *
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="fisica"
                checked={formData.tipo === "fisica"}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    tipo: e.target.value as "fisica" | "juridica",
                  }))
                }
                className="mr-2"
              />
              <User className="w-4 h-4 mr-1" />
              Pessoa Física
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="juridica"
                checked={formData.tipo === "juridica"}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    tipo: e.target.value as "fisica" | "juridica",
                  }))
                }
                className="mr-2"
              />
              <Building2 className="w-4 h-4 mr-1" />
              Pessoa Jurídica
            </label>
          </div>
        </div>

        {/* Busca por CPF/CNPJ */}
        {formData.tipo === "fisica" ? (
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Buscar Pessoa Física por CPF
            </label>
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5" />
                <input
                  type="text"
                  value={cpfSearch}
                  onChange={(e) => setCpfSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  placeholder="Digite o CPF para buscar"
                />
              </div>
              <button
                type="button"
                onClick={handleBuscarPorCpf}
                disabled={searchingCpf || !cpfSearch.trim()}
                className="px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
              >
                {searchingCpf ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span>Buscar</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Buscar Pessoa Jurídica por CNPJ
            </label>
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5" />
                <input
                  type="text"
                  value={cnpjSearch}
                  onChange={(e) => setCnpjSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  placeholder="Digite o CNPJ para buscar"
                />
              </div>
              <button
                type="button"
                onClick={handleBuscarPorCnpj}
                disabled={searchingCnpj || !cnpjSearch.trim()}
                className="px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
              >
                {searchingCnpj ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span>Buscar</span>
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nome/Razão Social */}
          {formData.tipo === "fisica" ? (
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Nome Completo *
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
          ) : (
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Razão Social *
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5" />
                <input
                  type="text"
                  value={formData.razaoSocial}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      razaoSocial: e.target.value,
                    }))
                  }
                  className={cn(
                    "w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200",
                    errors.razaoSocial
                      ? "border-red-300 focus:ring-red-500"
                      : "border-secondary-300"
                  )}
                  placeholder="Razão social"
                />
              </div>
              {errors.razaoSocial && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.razaoSocial}
                </p>
              )}
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Email *
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

          {/* CPF/CNPJ */}
          {formData.tipo === "fisica" ? (
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                CPF *
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5" />
                <input
                  type="text"
                  value={formData.cpf}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, cpf: e.target.value }))
                  }
                  className={cn(
                    "w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200",
                    errors.cpf
                      ? "border-red-300 focus:ring-red-500"
                      : "border-secondary-300"
                  )}
                  placeholder="000.000.000-00"
                />
              </div>
              {errors.cpf && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.cpf}
                </p>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                CNPJ *
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5" />
                <input
                  type="text"
                  value={formData.cnpj}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, cnpj: e.target.value }))
                  }
                  className={cn(
                    "w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200",
                    errors.cnpj
                      ? "border-red-300 focus:ring-red-500"
                      : "border-secondary-300"
                  )}
                  placeholder="00.000.000/0000-00"
                />
              </div>
              {errors.cnpj && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.cnpj}
                </p>
              )}
            </div>
          )}

          {/* Telefone 1 */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Telefone Principal *
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
            </label>
            <input
              type="tel"
              value={formData.telefone2}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, telefone2: e.target.value }))
              }
              className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              placeholder="(11) 88888-8888"
            />
          </div>

          {/* Filial */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Filial *
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5" />
              {loadingFiliais ? (
                <div className="w-full px-4 py-3 border border-secondary-300 rounded-xl bg-gray-50 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Carregando filiais...
                </div>
              ) : errorFiliais ? (
                <div className="w-full px-4 py-3 border border-red-300 rounded-xl bg-red-50 text-red-600">
                  Erro ao carregar filiais: {errorFiliais}
                </div>
              ) : (
                <select
                  value={formData.filialId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      filialId: parseInt(e.target.value) || 0,
                    }))
                  }
                  className={cn(
                    "w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200",
                    errors.filialId
                      ? "border-red-300 focus:ring-red-500"
                      : "border-secondary-300"
                  )}
                >
                  <option value={0}>Selecione uma filial</option>
                  {filiais.map((filial) => (
                    <option key={filial.id} value={filial.id}>
                      {filial.nome}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {errors.filialId && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.filialId}
              </p>
            )}
          </div>

          {/* Segmento */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Segmento
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5" />
              <input
                type="text"
                value={formData.segmento}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, segmento: e.target.value }))
                }
                className="w-full pl-12 pr-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                placeholder="Ex: Tecnologia, Saúde, Educação"
              />
            </div>
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
                    | "prospecto"
                    | "arquivado",
                }))
              }
              className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
            >
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
              <option value="prospecto">Prospecto</option>
              <option value="arquivado">Arquivado</option>
            </select>
          </div>

          {/* Valor do Contrato */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Valor do Contrato
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5" />
              <input
                type="text"
                value={formatCurrency(formData.valorContrato || 0)}
                onChange={(e) => {
                  const value = parseCurrency(e.target.value);
                  setFormData((prev) => ({ ...prev, valorContrato: value }));
                }}
                className="w-full pl-12 pr-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                placeholder="R$ 0,00"
              />
            </div>
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
  );
}
