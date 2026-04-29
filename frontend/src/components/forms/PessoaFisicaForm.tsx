"use client";

import { useState, useEffect, useCallback, memo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  validateCPF,
  formatCPF,
  validateEmail,
  validatePhone,
  formatPhone,
  validateCEP,
  formatCEP,
  validateFullName,
  validateRG,
  validateCNH,
  sanitizeString,
  normalizeEmail,
} from "../../utils/validators";
import {
  Save,
  X,
  Loader2,
  User,
  Mail,
  Phone,
  Calendar,
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
} from "lucide-react";
import {
  CreatePessoaFisicaDTO,
  UpdatePessoaFisicaDTO,
  PessoaFisica,
  SexoOptions,
} from "@/types/api";
import { cn } from "@/lib/utils";
import { consultarCep, CepData } from "@/lib/cep";

interface PessoaFisicaFormProps {
  initialData?: PessoaFisica | null;
  onSubmit: (
    data: CreatePessoaFisicaDTO | UpdatePessoaFisicaDTO
  ) => Promise<boolean>;
  onCancel: () => void;
  loading?: boolean;
}

interface FormData {
  nome: string;
  emailEmpresarial: string;
  emailPessoal: string;
  sexo: string;
  dataNascimento: string;
  estadoCivil: string;
  cpf: string;
  rg: string;
  cnh: string;
  telefone1: string;
  telefone2: string;
  endereco: {
    cidade: string;
    bairro: string;
    logradouro: string;
    cep: string;
    numero: string;
    complemento: string;
    estado: string;
  };
}

interface InputFieldProps {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  isEndereco?: boolean;
  options?: readonly { readonly value: string; readonly label: string }[];
  formatter?: (value: string) => string;
  icon?: React.ReactNode;
  placeholder?: string;
}

const initialFormData: FormData = {
  nome: "",
  emailEmpresarial: "",
  emailPessoal: "",
  sexo: "",
  dataNascimento: "",
  estadoCivil: "",
  cpf: "",
  rg: "",
  cnh: "",
  telefone1: "",
  telefone2: "",
  endereco: {
    cidade: "",
    bairro: "",
    logradouro: "",
    cep: "",
    numero: "",
    complemento: "",
    estado: "",
  },
};

// Componente InputField redesenhado
const InputField = memo(
  ({
    label,
    name,
    type = "text",
    required = false,
    isEndereco = false,
    options = undefined,
    value,
    onChange,
    error,
    formatter,
    icon,
    placeholder,
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
        const rawValue = e.target.value;
        const formattedValue = formatter ? formatter(rawValue) : rawValue;
        onChange(formattedValue);
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
              ? "-top-2 text-xs bg-neutral-800 px-2 rounded-full border border-neutral-700/50"
              : "top-4 text-neutral-500",
            isFocused ? "text-amber-400" : "text-neutral-400",
            error && "text-red-400"
          )}
        >
          {label} {required && <span className="text-red-400">*</span>}
        </label>

        <div className="relative">
          {icon && (
            <div
              className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300",
                isFocused ? "text-amber-400" : "text-neutral-500",
                error && "text-red-400"
              )}
            >
              {icon}
            </div>
          )}

          {options ? (
            <select
              ref={inputRef as React.RefObject<HTMLSelectElement>}
              id={fieldId}
              name={name}
              value={value}
              onChange={handleChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className={cn(
                "w-full h-14 px-4 bg-neutral-900/95 backdrop-blur-sm rounded-2xl",
                "border-2 transition-all duration-300",
                "focus:outline-none focus:ring-4",
                "text-neutral-200",
                icon && "pl-12",
                isFocused
                  ? "border-amber-500/50 ring-amber-500/20 shadow-lg shadow-amber-500/10"
                  : "border-neutral-700/30 hover:border-neutral-600/50",
                error && "border-red-500 focus:ring-red-500/20",
                "appearance-none cursor-pointer",
                "[&>option]:bg-neutral-900 [&>option]:text-neutral-200"
              )}
              required={required}
            >
              <option value="" className="text-neutral-500"></option>
              {options.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  className="bg-neutral-900 text-neutral-200"
                >
                  {option.label}
                </option>
              ))}
            </select>
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
                "w-full h-14 px-4 bg-neutral-900/95 backdrop-blur-sm rounded-2xl",
                "border-2 transition-all duration-300",
                "focus:outline-none focus:ring-4",
                "placeholder:text-transparent text-neutral-100 font-medium",
                icon && "pl-12",

                isFocused
                  ? "border-amber-500/50 ring-amber-500/20 shadow-lg shadow-amber-500/10"
                  : "border-neutral-700/30 hover:border-neutral-600/50",
                error && "border-red-500 focus:ring-red-500/20"
              )}
              required={required}
              autoComplete={
                type === "email" ? "email" : type === "tel" ? "tel" : "off"
              }
            />
          )}

          {/* Ícone de sucesso quando há valor e não há erro */}
          {value && !error && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </motion.div>
          )}
        </div>

        {/* Mensagem de erro */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 mt-2 px-4"
            >
              <AlertCircle className="w-4 h-4 text-red-400" />
              <p className="text-sm text-red-400">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }
);

InputField.displayName = "InputField";

// Componente de seção do formulário
const FormSection = ({
  title,
  icon,
  children,
  delay = 0,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="relative"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-amber-600/5 rounded-3xl blur-xl" />
    <div className="relative bg-neutral-900/30 backdrop-blur-xl rounded-3xl p-8 border border-neutral-700/30 shadow-xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl text-neutral-900 shadow-lg shadow-amber-500/30">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-neutral-100">{title}</h3>
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  </motion.div>
);

export default function PessoaFisicaForm({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
}: PessoaFisicaFormProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Inicializar dados se for edição
  useEffect(() => {
    if (initialData) {
      setFormData({
        nome: initialData.nome || "",
        emailEmpresarial: initialData.emailEmpresarial || "",
        emailPessoal: initialData.emailPessoal || "",
        sexo: initialData.sexo || "",
        dataNascimento: initialData.dataNascimento || "",
        estadoCivil: initialData.estadoCivil || "",
        cpf: initialData.cpf || "",
        rg: initialData.rg || "",
        cnh: initialData.cnh || "",
        telefone1: initialData.telefone1 || "",
        telefone2: initialData.telefone2 || "",
        endereco: initialData.endereco
          ? {
              cidade: initialData.endereco.cidade || "",
              bairro: initialData.endereco.bairro || "",
              logradouro: initialData.endereco.logradouro || "",
              cep: initialData.endereco.cep || "",
              numero: initialData.endereco.numero || "",
              complemento: initialData.endereco.complemento || "",
              estado: initialData.endereco.estado || "",
            }
          : {
              cidade: "",
              bairro: "",
              logradouro: "",
              cep: "",
              numero: "",
              estado: "",
              complemento: "",
            },
      });
    }
  }, [initialData]);

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

  const formatData = (value: string) => {
    // Remove tudo que não é dígito
    const numbers = value.replace(/\D/g, "");

    // Limita a 8 dígitos (dd/mm/aaaa)
    const limitedNumbers = numbers.slice(0, 8);

    // Aplica a máscara dd/mm/aaaa
    if (limitedNumbers.length <= 2) {
      return limitedNumbers;
    } else if (limitedNumbers.length <= 4) {
      return `${limitedNumbers.slice(0, 2)}/${limitedNumbers.slice(2)}`;
    } else {
      return `${limitedNumbers.slice(0, 2)}/${limitedNumbers.slice(
        2,
        4
      )}/${limitedNumbers.slice(4)}`;
    }
  };

  const formatCPF = (value: string) => {
    // Remove tudo que não é dígito
    const numbers = value.replace(/\D/g, "");

    // Limita a 11 dígitos (XXX.XXX.XXX-XX)
    const limitedNumbers = numbers.slice(0, 11);

    // Aplica a máscara XXX.XXX.XXX-XX
    if (limitedNumbers.length <= 3) {
      return limitedNumbers;
    } else if (limitedNumbers.length <= 6) {
      return `${limitedNumbers.slice(0, 3)}.${limitedNumbers.slice(3)}`;
    } else if (limitedNumbers.length <= 9) {
      return `${limitedNumbers.slice(0, 3)}.${limitedNumbers.slice(
        3,
        6
      )}.${limitedNumbers.slice(6)}`;
    } else {
      return `${limitedNumbers.slice(0, 3)}.${limitedNumbers.slice(
        3,
        6
      )}.${limitedNumbers.slice(6, 9)}-${limitedNumbers.slice(9)}`;
    }
  };

  const formatCEP = (value: string) => {
    // Remove tudo que não é dígito
    const numbers = value.replace(/\D/g, "");

    // Limita a 8 dígitos (00000-000)
    const limitedNumbers = numbers.slice(0, 8);

    // Aplica a máscara 00000-000
    if (limitedNumbers.length <= 5) {
      return limitedNumbers;
    } else {
      return `${limitedNumbers.slice(0, 5)}-${limitedNumbers.slice(5)}`;
    }
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
              estado: cepData.estado,
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

    // Validações robustas usando os novos validadores

    // Nome completo
    if (!validateFullName(formData.nome)) {
      if (!formData.nome.trim()) {
        newErrors.nome = "Nome é obrigatório";
      } else {
        newErrors.nome =
          "Informe nome e sobrenome completos (2-200 caracteres)";
      }
    }

    // E-mail empresarial
    if (!formData.emailEmpresarial.trim()) {
      newErrors.emailEmpresarial = "E-mail empresarial é obrigatório";
    } else if (!validateEmail(formData.emailEmpresarial)) {
      newErrors.emailEmpresarial = "E-mail empresarial inválido";
    }

    // E-mail pessoal (opcional)
    if (formData.emailPessoal && !validateEmail(formData.emailPessoal)) {
      newErrors.emailPessoal = "E-mail pessoal inválido";
    }

    // CPF
    if (!formData.cpf.trim()) {
      newErrors.cpf = "CPF é obrigatório";
    } else if (!validateCPF(formData.cpf)) {
      newErrors.cpf = "CPF inválido";
    }

    // Data de nascimento e idade
    if (!formData.dataNascimento) {
      newErrors.dataNascimento = "Data de nascimento é obrigatória";
    }

    // Sexo
    if (!formData.sexo) {
      newErrors.sexo = "Sexo é obrigatório";
    }

    // Telefone principal
    if (!formData.telefone1.trim()) {
      newErrors.telefone1 = "Telefone principal é obrigatório";
    } else if (!validatePhone(formData.telefone1)) {
      newErrors.telefone1 = "Telefone principal inválido";
    }

    // Telefone secundário (opcional)
    if (formData.telefone2 && !validatePhone(formData.telefone2)) {
      newErrors.telefone2 = "Telefone secundário inválido";
    }

    // Campos opcionais
    if (!validateRG(formData.rg)) {
      newErrors.rg = "RG não pode exceder 20 caracteres";
    }

    if (!validateCNH(formData.cnh)) {
      newErrors.cnh = "CNH não pode exceder 20 caracteres";
    }

    // Endereço
    if (!formData.endereco.cidade.trim()) {
      newErrors["endereco.cidade"] = "Cidade é obrigatória";
    }

    if (!formData.endereco.bairro.trim()) {
      newErrors["endereco.bairro"] = "Bairro é obrigatório";
    }

    if (!formData.endereco.logradouro.trim()) {
      newErrors["endereco.logradouro"] = "Logradouro é obrigatório";
    }

    if (!formData.endereco.numero.trim()) {
      newErrors["endereco.numero"] = "Número é obrigatório";
    }

    if (!formData.endereco.cep.trim()) {
      newErrors["endereco.cep"] = "CEP é obrigatório";
    } else if (!validateCEP(formData.endereco.cep)) {
      newErrors["endereco.cep"] = "CEP inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Converte a data de dd/mm/aaaa para aaaa-mm-dd
    const dataNascimento = formData.dataNascimento
      ? formData.dataNascimento.split("/").reverse().join("-")
      : "";

    const submitData: CreatePessoaFisicaDTO = {
      nome: formData.nome,
      emailEmpresarial: formData.emailEmpresarial,
      emailPessoal: formData.emailPessoal || undefined,
      sexo: formData.sexo,
      dataNascimento: dataNascimento,
      estadoCivil: formData.estadoCivil || "",
      cpf: formData.cpf,
      rg: formData.rg || undefined,
      cnh: formData.cnh || undefined,
      telefone1: formData.telefone1,
      telefone2: formData.telefone2 || undefined,
      endereco: {
        cidade: formData.endereco.cidade,
        bairro: formData.endereco.bairro,
        logradouro: formData.endereco.logradouro,
        cep: formData.endereco.cep,
        numero: formData.endereco.numero,
        complemento: formData.endereco.complemento || undefined,
        estado: formData.endereco.estado,
      },
    };

    // Se é edição, incluir IDs
    if (initialData) {
      const updateData: UpdatePessoaFisicaDTO = {
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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-neutral-900/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-neutral-800"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <div className="p-4 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl text-neutral-900 shadow-xl shadow-amber-500/30">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
              {initialData ? "Editar Pessoa Física" : "Nova Pessoa Física"}
            </h2>
            <p className="text-neutral-400 mt-1">
              Preencha os dados do cliente com atenção
            </p>
          </div>
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={onCancel}
          className="p-3 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-2xl transition-all duration-300 border border-transparent hover:border-red-500/30"
        >
          <X className="w-6 h-6" />
        </motion.button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Dados Pessoais */}
        <FormSection
          title="Dados Pessoais"
          icon={<User className="w-6 h-6" />}
          delay={0.1}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="Nome Completo"
              name="nome"
              required
              value={formData.nome}
              onChange={(value) => handleFieldChange("nome", value)}
              error={errors.nome}
              icon={<User className="w-5 h-5" />}
            />
            <InputField
              label="E-mail Empresarial"
              name="emailEmpresarial"
              type="email"
              required
              value={formData.emailEmpresarial}
              onChange={(value) => handleFieldChange("emailEmpresarial", value)}
              error={errors.emailEmpresarial}
              icon={<Mail className="w-5 h-5" />}
            />
            <InputField
              label="E-mail Pessoal"
              name="emailPessoal"
              type="email"
              value={formData.emailPessoal}
              onChange={(value) => handleFieldChange("emailPessoal", value)}
              error={errors.emailPessoal}
              icon={<Mail className="w-5 h-5" />}
            />
            <InputField
              label="Sexo"
              name="sexo"
              options={SexoOptions}
              required
              value={formData.sexo}
              onChange={(value) => handleFieldChange("sexo", value)}
              error={errors.sexo}
              icon={<User className="w-5 h-5" />}
            />
            <InputField
              label="Data de Nascimento"
              name="dataNascimento"
              type="text"
              required
              value={formData.dataNascimento}
              onChange={(value) => handleFieldChange("dataNascimento", value)}
              error={errors.dataNascimento}
              formatter={formatData}
              icon={<Calendar className="w-5 h-5" />}
              placeholder="dd/mm/aaaa"
            />
          </div>
        </FormSection>

        {/* Documentos */}
        <FormSection
          title="Documentos"
          icon={<CreditCard className="w-6 h-6" />}
          delay={0.2}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <InputField
              label="CPF"
              name="cpf"
              required
              value={formData.cpf}
              onChange={(value) => handleFieldChange("cpf", value)}
              error={errors.cpf}
              formatter={formatCPF}
              icon={<CreditCard className="w-5 h-5" />}
              placeholder="000.000.000-00"
            />
            <InputField
              label="RG"
              name="rg"
              value={formData.rg}
              onChange={(value) => handleFieldChange("rg", value)}
              error={errors.rg}
              icon={<CreditCard className="w-5 h-5" />}
            />
            <InputField
              label="CNH"
              name="cnh"
              value={formData.cnh}
              onChange={(value) => handleFieldChange("cnh", value)}
              error={errors.cnh}
              icon={<CreditCard className="w-5 h-5" />}
            />
          </div>
        </FormSection>

        {/* Contato */}
        <FormSection
          title="Informações de Contato"
          icon={<Phone className="w-6 h-6" />}
          delay={0.3}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              placeholder="(00) 00000-0000"
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
              placeholder="(00) 00000-0000"
            />
          </div>
        </FormSection>

        {/* Endereço */}
        <FormSection
          title="Endereço"
          icon={<MapPin className="w-6 h-6" />}
          delay={0.4}
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
            <InputField
              label="Estado"
              name="estado"
              isEndereco
              required
              value={formData.endereco.estado}
              onChange={(value) => handleFieldChange("estado", value, true)}
              error={errors["endereco.estado"]}
              icon={<MapPin className="w-5 h-5" />}
              placeholder="UF"
            />
          </div>
        </FormSection>

        {/* Botões */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex justify-end gap-4 pt-8"
        >
          <motion.button
            type="button"
            onClick={onCancel}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-4 text-neutral-300 bg-neutral-800/50 border-2 border-neutral-700 rounded-2xl hover:bg-neutral-800 hover:border-neutral-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
          >
            Cancelar
          </motion.button>
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-900 rounded-2xl",
              "hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-all duration-300 font-semibold shadow-xl hover:shadow-2xl shadow-amber-500/30",
              "flex items-center gap-3"
            )}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>{initialData ? "Atualizar" : "Salvar"}</span>
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </motion.button>
        </motion.div>
      </form>
    </motion.div>
  );
}
