"use client";

import { useState, useEffect, useCallback, memo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save,
  X,
  Loader2,
  Building2,
  Mail,
  Phone,
  CreditCard,
  MapPin,
  Shield,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Home,
  Hash,
  Building,
  Navigation,
  UserCheck,
  Globe,
  Briefcase,
} from "lucide-react";
import {
  CreatePessoaJuridicaDTO,
  UpdatePessoaJuridicaDTO,
  PessoaJuridica,
  ResponsavelTecnicoOption,
} from "@/types/api";
import { cn } from "@/lib/utils";
import { consultarCep, CepData } from "@/lib/cep";

interface PessoaJuridicaFormProps {
  initialData?: PessoaJuridica | null;
  responsaveisTecnicos: ResponsavelTecnicoOption[];
  onSubmit: (
    data: CreatePessoaJuridicaDTO | UpdatePessoaJuridicaDTO
  ) => Promise<boolean>;
  onCancel: () => void;
  loading?: boolean;
}

interface FormData {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  responsavelTecnicoId: string;
  email: string;
  telefone1: string;
  telefone2: string;
  endereco: {
    cidade: string;
    bairro: string;
    logradouro: string;
    cep: string;
    numero: string;
    complemento: string;
  };
}

interface InputFieldProps {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  isEndereco?: boolean;
  options?: { value: string; label: string }[];
  formatter?: (value: string) => string;
  icon?: React.ReactNode;
  placeholder?: string;
  description?: string;
}

const initialFormData: FormData = {
  razaoSocial: "",
  nomeFantasia: "",
  cnpj: "",
  responsavelTecnicoId: "",
  email: "",
  telefone1: "",
  telefone2: "",
  endereco: {
    cidade: "",
    bairro: "",
    logradouro: "",
    cep: "",
    numero: "",
    complemento: "",
  },
};

// Componente InputField redesenhado com estilo corporativo moderno
const InputField = memo(
  ({
    label,
    name,
    type = "text",
    required = false,
    isEndereco = false,
    options = undefined,
    formatter = undefined,
    value,
    onChange,
    error,
    icon,
    placeholder,
    description,
  }: InputFieldProps & {
    value: string;
    onChange: (value: string) => void;
    error?: string;
  }) => {
    const fieldId = isEndereco ? `endereco-${name}` : name;
    const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const value = formatter ? formatter(e.target.value) : e.target.value;
        onChange(value);
      },
      [onChange, formatter]
    );

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative group"
      >
        <label
          htmlFor={fieldId}
          className={cn(
            "absolute left-4 transition-all duration-300 pointer-events-none z-10",
            "text-sm font-medium",
            isFocused || value
              ? "-top-2 text-xs bg-white px-2 rounded-full"
              : "top-4 text-secondary-500",
            isFocused ? "text-green-600" : "text-secondary-500",
            error && "text-red-500"
          )}
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>

        <div className="relative">
          {icon && (
            <div
              className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-300",
                isFocused ? "text-green-600 scale-110" : "text-secondary-400",
                error && "text-red-500"
              )}
            >
              {icon}
            </div>
          )}

          {options ? (
            <div className="relative">
              <select
                ref={inputRef as React.RefObject<HTMLSelectElement>}
                id={fieldId}
                name={name}
                value={value}
                onChange={handleChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className={cn(
                  "w-full h-14 px-4 bg-white/80 backdrop-blur-sm rounded-2xl",
                  "border-2 transition-all duration-300",
                  "focus:outline-none focus:ring-4",
                  icon && "pl-12",
                  isFocused
                    ? "border-green-500 ring-green-500/20 shadow-lg shadow-green-500/10"
                    : "border-secondary-200 hover:border-secondary-300 hover:shadow-md",
                  error && "border-red-500 focus:ring-red-500/20",
                  "appearance-none cursor-pointer"
                )}
                required={required}
              >
                <option value=""></option>
                {options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400 pointer-events-none rotate-90" />
            </div>
          ) : (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              id={fieldId}
              name={name}
              type={type}
              value={value}
              onChange={handleChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={type === "date" ? "" : placeholder}
              className={cn(
                "w-full h-14 px-4 bg-white/80 backdrop-blur-sm rounded-2xl",
                "border-2 transition-all duration-300",
                "focus:outline-none focus:ring-4",
                "placeholder:text-transparent",
                icon && "pl-12",

                isFocused
                  ? "border-green-500 ring-green-500/20 shadow-lg shadow-green-500/10"
                  : "border-secondary-200 hover:border-secondary-300 hover:shadow-md",
                error && "border-red-500 focus:ring-red-500/20"
              )}
              required={required}
              autoComplete={
                type === "email" ? "email" : type === "tel" ? "tel" : "off"
              }
            />
          )}

          {/* Ícone de sucesso animado */}
          {value && !error && (
            <motion.div
              initial={{ scale: 0, opacity: 0, rotate: -180 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </motion.div>
          )}
        </div>

        {/* Descrição do campo */}
        {description && !error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-secondary-500 mt-2 px-4"
          >
            {description}
          </motion.p>
        )}

        {/* Mensagem de erro animada */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="flex items-center gap-2 mt-2 px-4 overflow-hidden"
            >
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }
);

InputField.displayName = "InputField";

// Componente de seção aprimorado com efeito 3D
const FormSection = ({
  title,
  icon,
  children,
  delay = 0,
  description,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
  description?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 30, rotateX: -15 }}
    animate={{ opacity: 1, y: 0, rotateX: 0 }}
    transition={{ duration: 0.6, delay }}
    style={{ transformStyle: "preserve-3d" }}
    className="relative"
  >
    {/* Efeito de gradiente de fundo */}
    <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-green-400/5 to-transparent rounded-3xl blur-2xl" />

    {/* Card principal com glassmorphism */}
    <div className="relative bg-white/60 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-2xl hover:shadow-3xl transition-all duration-500">
      {/* Header da seção */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.8 }}
            className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl text-white shadow-lg shadow-green-500/30"
          >
            {icon}
          </motion.div>
          <div>
            <h3 className="text-xl font-bold text-secondary-900">{title}</h3>
            {description && (
              <p className="text-sm text-secondary-600 mt-1">{description}</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">{children}</div>
    </div>
  </motion.div>
);

export default function PessoaJuridicaForm({
  initialData,
  responsaveisTecnicos,
  onSubmit,
  onCancel,
  loading = false,
}: PessoaJuridicaFormProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formProgress, setFormProgress] = useState(0);

  // Inicializar dados se for edição
  useEffect(() => {
    if (initialData) {
      setFormData({
        razaoSocial: initialData.razaoSocial,
        nomeFantasia: initialData.nomeFantasia || "",
        cnpj: initialData.cnpj,
        responsavelTecnicoId: initialData.responsavelTecnicoId.toString(),
        email: initialData.email,
        telefone1: initialData.telefone1,
        telefone2: initialData.telefone2 || "",
        endereco: initialData.endereco ? {
          cidade: initialData.endereco.cidade || "",
          bairro: initialData.endereco.bairro || "",
          logradouro: initialData.endereco.logradouro || "",
          cep: initialData.endereco.cep || "",
          numero: initialData.endereco.numero || "",
          complemento: initialData.endereco.complemento || "",
        } : {
          cidade: "",
          bairro: "",
          logradouro: "",
          cep: "",
          numero: "",
          complemento: "",
        },
      });
    }
  }, [initialData]);

  // Calcular progresso do formulário
  useEffect(() => {
    const totalFields = 13;
    let filledFields = 0;

    if (formData.razaoSocial) filledFields++;
    if (formData.nomeFantasia) filledFields++;
    if (formData.cnpj) filledFields++;
    if (formData.responsavelTecnicoId) filledFields++;
    if (formData.email) filledFields++;
    if (formData.telefone1) filledFields++;
    if (formData.telefone2) filledFields++;
    if (formData.endereco.cidade) filledFields++;
    if (formData.endereco.bairro) filledFields++;
    if (formData.endereco.logradouro) filledFields++;
    if (formData.endereco.cep) filledFields++;
    if (formData.endereco.numero) filledFields++;
    if (formData.endereco.complemento) filledFields++;

    setFormProgress((filledFields / totalFields) * 100);
  }, [formData]);

  const handleFieldChange = useCallback(
    (field: string, value: string, isEndereco = false) => {
      setFormData((prev) => {
        if (isEndereco) {
          return {
            ...prev,
            endereco: {
              ...prev.endereco,
              [field]: value,
            },
          };
        } else {
          return {
            ...prev,
            [field]: value,
          };
        }
      });

      // Limpar erro do campo
      const errorKey = isEndereco ? `endereco.${field}` : field;
      if (errors[errorKey]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[errorKey];
          return newErrors;
        });
      }
    },
    [errors]
  );

  // Funções de formatação
  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 6)
      return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
    if (numbers.length <= 9)
      return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(
        5
      )}`;
    if (numbers.length <= 13)
      return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(
        5,
        8
      )}/${numbers.slice(8)}`;
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(
      5,
      8
    )}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  const formatTelefone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 6)
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 10)
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(
        6
      )}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(
      7,
      11
    )}`;
  };

  const handleCepChange = async (value: string) => {
    // Atualiza o CEP no formulário
    handleFieldChange("cep", value, true);

    // Se o CEP tem 8 dígitos, consulta a API
    const cleanCep = value.replace(/\D/g, "");
    if (cleanCep.length === 8) {
      try {
        const cepData = await consultarCep(value);
        if (cepData) {
          // Auto-preenche os campos de endereço
          setFormData((prev) => ({
            ...prev,
            endereco: {
              ...prev.endereco,
              cep: cepData.cep,
              logradouro: cepData.logradouro,
              bairro: cepData.bairro,
              cidade: cepData.cidade,
              numero: prev.endereco.numero,
              complemento: cepData.complemento || prev.endereco.complemento,
            },
          }));
        }
      } catch (error) {
        console.error("Erro ao consultar CEP:", error);
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validações básicas
    if (!formData.razaoSocial.trim())
      newErrors.razaoSocial = "Razão social é obrigatória";

    // Validação de CNPJ
    if (!formData.cnpj.trim()) {
      newErrors.cnpj = "CNPJ é obrigatório";
    } else {
      const cnpjNumeros = formData.cnpj.replace(/\D/g, "");
      if (cnpjNumeros.length < 14) {
        newErrors.cnpj = "CNPJ deve ter 14 dígitos";
      }
    }

    if (!formData.responsavelTecnicoId)
      newErrors.responsavelTecnicoId = "Responsável técnico é obrigatório";
    if (!formData.email.trim()) newErrors.email = "E-mail é obrigatório";

    // Validação de telefone
    if (!formData.telefone1.trim()) {
      newErrors.telefone1 = "Telefone é obrigatório";
    }

    // Validações de endereço
    if (!formData.endereco.cidade.trim())
      newErrors["endereco.cidade"] = "Cidade é obrigatória";
    if (!formData.endereco.bairro.trim())
      newErrors["endereco.bairro"] = "Bairro é obrigatório";
    if (!formData.endereco.logradouro.trim())
      newErrors["endereco.logradouro"] = "Logradouro é obrigatório";
    if (!formData.endereco.cep.trim())
      newErrors["endereco.cep"] = "CEP é obrigatório";
    if (!formData.endereco.numero.trim())
      newErrors["endereco.numero"] = "Número é obrigatório";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Encontrar o responsável técnico selecionado
    const responsavelTecnico = responsaveisTecnicos.find(
      (resp) => resp.id.toString() === formData.responsavelTecnicoId
    );

    if (!responsavelTecnico) {
      setErrors({ responsavelTecnicoId: "Responsável técnico inválido" });
      return;
    }

    const cnpjNumeros = formData.cnpj.replace(/\D/g, "");
    const cnpjFormatado = formatCNPJ(cnpjNumeros);

    const submitData = {
      razaoSocial: formData.razaoSocial,
      nomeFantasia: formData.nomeFantasia || undefined,
      cnpj: cnpjFormatado,
      responsavelTecnicoId: responsavelTecnico.id,
      email: formData.email,
      telefone1: formData.telefone1,
      telefone2: formData.telefone2 || undefined,
      endereco: {
        cidade: formData.endereco.cidade,
        bairro: formData.endereco.bairro,
        logradouro: formData.endereco.logradouro,
        cep: formData.endereco.cep,
        numero: formData.endereco.numero,
        complemento: formData.endereco.complemento || undefined,
      },
    };

    if (initialData) {
      const updateData: UpdatePessoaJuridicaDTO = {
        ...submitData,
        id: initialData.id,
        enderecoId: initialData.enderecoId,
      };
      const success = await onSubmit(updateData);
      if (success) {
        onCancel();
      }
    } else {
      const success = await onSubmit(submitData);
      if (success) {
        setFormData(initialFormData);
        onCancel();
      }
    }
  };

  // Converter responsáveis técnicos para formato de opções (ordenado alfabeticamente)
  const responsavelOptions = [...responsaveisTecnicos]
    .sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" })
    )
    .map((resp) => ({
      value: resp.id.toString(),
      label: resp.nome,
    }));

  // Barra de progresso animada
  const ProgressBar = () => (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-secondary-600">
          Progresso do formulário
        </span>
        <span className="text-sm font-bold text-green-600">
          {Math.round(formProgress)}%
        </span>
      </div>
      <div className="h-2 bg-secondary-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${formProgress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
        />
      </div>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-green-50 via-white to-secondary-50 rounded-3xl p-8 shadow-2xl backdrop-blur-xl"
    >
      {/* Header Corporativo */}
      <div className="flex items-center justify-between mb-8">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-4"
        >
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.8 }}
            className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl text-white shadow-xl shadow-green-500/30"
          >
            <Building2 className="w-8 h-8" />
          </motion.div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
              {initialData ? "Editar Pessoa Jurídica" : "Nova Pessoa Jurídica"}
            </h2>
            <p className="text-secondary-600 mt-1">
              Cadastro empresarial completo e seguro
            </p>
          </div>
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={onCancel}
          className="p-3 text-secondary-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all duration-300"
        >
          <X className="w-6 h-6" />
        </motion.button>
      </div>

      {/* Barra de Progresso */}
      <ProgressBar />

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Dados da Empresa */}
        <FormSection
          title="Informações Empresariais"
          icon={<Building2 className="w-6 h-6" />}
          delay={0.1}
          description="Dados principais da empresa"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="Razão Social"
              name="razaoSocial"
              required
              value={formData.razaoSocial}
              onChange={(value) => handleFieldChange("razaoSocial", value)}
              error={errors.razaoSocial}
              icon={<Briefcase className="w-5 h-5" />}
              description="Nome oficial da empresa"
            />
            <InputField
              label="Nome Fantasia"
              name="nomeFantasia"
              value={formData.nomeFantasia}
              onChange={(value) => handleFieldChange("nomeFantasia", value)}
              error={errors.nomeFantasia}
              icon={<Globe className="w-5 h-5" />}
              description="Nome comercial (opcional)"
            />
            <InputField
              label="CNPJ"
              name="cnpj"
              required
              value={formData.cnpj}
              onChange={(value) => handleFieldChange("cnpj", value)}
              error={errors.cnpj}
              formatter={formatCNPJ}
              icon={<CreditCard className="w-5 h-5" />}
              placeholder="00.000.000/0000-00"
              description="Cadastro Nacional da Pessoa Jurídica"
            />
            <InputField
              label="Responsável Técnico"
              name="responsavelTecnicoId"
              options={responsavelOptions}
              required
              value={formData.responsavelTecnicoId}
              onChange={(value) =>
                handleFieldChange("responsavelTecnicoId", value)
              }
              error={errors.responsavelTecnicoId}
              icon={<UserCheck className="w-5 h-5" />}
              description="Pessoa física responsável"
            />
          </div>
        </FormSection>

        {/* Contato Empresarial */}
        <FormSection
          title="Contato Empresarial"
          icon={<Phone className="w-6 h-6" />}
          delay={0.2}
          description="Canais de comunicação da empresa"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="E-mail Corporativo"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={(value) => handleFieldChange("email", value)}
              error={errors.email}
              icon={<Mail className="w-5 h-5" />}
              placeholder="contato@empresa.com.br"
            />
            <InputField
              label="Telefone Principal"
              name="telefone1"
              type="tel"
              required
              value={formData.telefone1}
              onChange={(value) => handleFieldChange("telefone1", value)}
              error={errors.telefone1}
              formatter={formatTelefone}
              icon={<Phone className="w-5 h-5" />}
              placeholder="(00) 0000-0000"
            />
            <InputField
              label="Telefone Secundário"
              name="telefone2"
              type="tel"
              value={formData.telefone2}
              onChange={(value) => handleFieldChange("telefone2", value)}
              error={errors.telefone2}
              formatter={formatTelefone}
              icon={<Phone className="w-5 h-5" />}
              placeholder="(00) 0000-0000"
            />
          </div>
        </FormSection>

        {/* Endereço Comercial */}
        <FormSection
          title="Endereço Comercial"
          icon={<MapPin className="w-6 h-6" />}
          delay={0.3}
          description="Localização da sede empresarial"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="CEP"
              name="cep"
              isEndereco
              required
              value={formData.endereco.cep}
              onChange={handleCepChange}
              error={errors["endereco.cep"]}
              formatter={formatCEP}
              icon={<MapPin className="w-5 h-5" />}
              placeholder="00000-000"
            />
            <InputField
              label="Logradouro"
              name="logradouro"
              isEndereco
              required
              value={formData.endereco.logradouro}
              onChange={(value) => handleFieldChange("logradouro", value, true)}
              error={errors["endereco.logradouro"]}
              icon={<Home className="w-5 h-5" />}
            />
            <InputField
              label="Número"
              name="numero"
              isEndereco
              required
              value={formData.endereco.numero}
              onChange={(value) => handleFieldChange("numero", value, true)}
              error={errors["endereco.numero"]}
              icon={<Hash className="w-5 h-5" />}
            />
            <InputField
              label="Complemento"
              name="complemento"
              isEndereco
              value={formData.endereco.complemento}
              onChange={(value) =>
                handleFieldChange("complemento", value, true)
              }
              error={errors["endereco.complemento"]}
              icon={<Home className="w-5 h-5" />}
              placeholder="Sala, andar, bloco..."
            />
            <InputField
              label="Bairro"
              name="bairro"
              isEndereco
              required
              value={formData.endereco.bairro}
              onChange={(value) => handleFieldChange("bairro", value, true)}
              error={errors["endereco.bairro"]}
              icon={<Navigation className="w-5 h-5" />}
            />
            <InputField
              label="Cidade"
              name="cidade"
              isEndereco
              required
              value={formData.endereco.cidade}
              onChange={(value) => handleFieldChange("cidade", value, true)}
              error={errors["endereco.cidade"]}
              icon={<Building className="w-5 h-5" />}
            />
          </div>
        </FormSection>

        {/* Botões de Ação */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-between items-center pt-8"
        >
          {/* Informação adicional */}
          <div className="flex items-center gap-2 text-sm text-secondary-500">
            <Shield className="w-4 h-4" />
            <span>Dados protegidos e criptografados</span>
          </div>

          {/* Botões */}
          <div className="flex gap-4">
            <motion.button
              type="button"
              onClick={onCancel}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 text-secondary-700 bg-white border-2 border-secondary-300 rounded-2xl hover:bg-secondary-50 hover:border-secondary-400 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
            >
              Cancelar
            </motion.button>
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-2xl",
                "hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-all duration-300 font-semibold shadow-xl hover:shadow-2xl",
                "flex items-center gap-3 min-w-[180px] justify-center"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>{initialData ? "Atualizar" : "Cadastrar"}</span>
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </form>
    </motion.div>
  );
}
