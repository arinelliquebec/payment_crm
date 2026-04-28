"use client";

import { useState, useEffect, useCallback, memo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save,
  X,
  Loader2,
  User,
  Mail,
  Key,
  Shield,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Users,
  Building2,
  Eye,
  EyeOff,
  UserCheck,
  Lock,
} from "lucide-react";
import {
  CreateUsuarioDTO,
  UpdateUsuarioDTO,
  Usuario,
  PessoaFisicaOption,
  PessoaJuridicaOption,
  GrupoAcessoOptions,
  TipoPessoaOptions,
} from "@/types/api";
import { cn } from "@/lib/utils";

interface UsuarioFormProps {
  initialData?: Usuario | null;
  pessoasFisicas: PessoaFisicaOption[];
  pessoasJuridicas: PessoaJuridicaOption[];
  onSubmit: (data: CreateUsuarioDTO | UpdateUsuarioDTO) => Promise<boolean>;
  onCancel: () => void;
  loading?: boolean;
}

interface FormData {
  login: string;
  email: string;
  senha: string;
  confirmarSenha: string;
  grupoAcesso: string;
  tipoPessoa: string;
  pessoaFisicaId: string;
  pessoaJuridicaId: string;
  ativo: boolean;
}

interface InputFieldProps {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  options?: readonly { readonly value: string; readonly label: string }[];
  icon?: React.ReactNode;
  placeholder?: string;
  description?: string;
  disabled?: boolean;
}

const initialFormData: FormData = {
  login: "",
  email: "",
  senha: "",
  confirmarSenha: "",
  grupoAcesso: "",
  tipoPessoa: "",
  pessoaFisicaId: "",
  pessoaJuridicaId: "",
  ativo: true,
};

// Componente InputField
const InputField = memo(
  ({
    label,
    name,
    type = "text",
    required = false,
    options = undefined,
    value,
    onChange,
    error,
    icon,
    placeholder,
    description,
    disabled = false,
  }: InputFieldProps & {
    value: string | boolean;
    onChange: (value: string | boolean) => void;
    error?: string;
  }) => {
    const fieldId = name;
    const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        if (type === "checkbox") {
          onChange((e.target as HTMLInputElement).checked);
        } else {
          onChange(e.target.value);
        }
      },
      [onChange, type]
    );

    const isPasswordField = type === "password";
    const inputType = isPasswordField && showPassword ? "text" : type;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative group"
      >
        {type === "checkbox" ? (
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              id={fieldId}
              name={name}
              checked={value as boolean}
              onChange={handleChange}
              disabled={disabled}
              className="w-5 h-5 text-primary-600 border-2 border-secondary-300 rounded focus:ring-4 focus:ring-primary-500/20"
            />
            <span className="text-secondary-700 font-medium">{label}</span>
          </label>
        ) : (
          <>
            <label
              htmlFor={fieldId}
              className={cn(
                "absolute left-4 transition-all duration-300 pointer-events-none z-10",
                "text-sm font-medium",
                isFocused || value
                  ? "-top-2 text-xs bg-white px-2 rounded-full"
                  : "top-4 text-secondary-500",
                isFocused ? "text-primary-600" : "text-secondary-500",
                error && "text-red-500"
              )}
            >
              {label} {required && <span className="text-red-500">*</span>}
            </label>

            <div className="relative">
              {icon && (
                <div
                  className={cn(
                    "absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300",
                    isFocused ? "text-primary-600" : "text-secondary-400",
                    error && "text-red-500"
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
                  value={value as string}
                  onChange={handleChange}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  disabled={disabled}
                  className={cn(
                    "w-full h-14 px-4 bg-white/80 backdrop-blur-sm rounded-2xl",
                    "border-2 transition-all duration-300",
                    "focus:outline-none focus:ring-4",
                    icon && "pl-12",
                    isFocused
                      ? "border-primary-500 ring-primary-500/20 shadow-lg shadow-primary-500/10"
                      : "border-secondary-200 hover:border-secondary-300",
                    error && "border-red-500 focus:ring-red-500/20",
                    "appearance-none cursor-pointer",
                    disabled && "opacity-50 cursor-not-allowed"
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
              ) : (
                <input
                  ref={inputRef as React.RefObject<HTMLInputElement>}
                  id={fieldId}
                  name={name}
                  type={inputType}
                  value={value as string}
                  onChange={handleChange}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder={type === "date" ? "" : placeholder}
                  disabled={disabled}
                  className={cn(
                    "w-full h-14 px-4 bg-white/80 backdrop-blur-sm rounded-2xl",
                    "border-2 transition-all duration-300",
                    "focus:outline-none focus:ring-4",
                    "placeholder:text-transparent",
                    icon && "pl-12",
                    isPasswordField && "pr-12",

                    isFocused
                      ? "border-primary-500 ring-primary-500/20 shadow-lg shadow-primary-500/10"
                      : "border-secondary-200 hover:border-secondary-300",
                    error && "border-red-500 focus:ring-red-500/20",
                    disabled && "opacity-50 cursor-not-allowed"
                  )}
                  required={required}
                  autoComplete={
                    type === "email"
                      ? "email"
                      : name === "senha"
                      ? "new-password"
                      : "off"
                  }
                />
              )}

              {/* Botão mostrar/ocultar senha */}
              {isPasswordField && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              )}

              {/* Ícone de sucesso */}
              {value && !error && !isPasswordField && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
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

            {/* Mensagem de erro */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 mt-2 px-4"
                >
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <p className="text-sm text-red-600">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
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
    <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-accent-500/5 rounded-3xl blur-xl" />
    <div className="relative bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl text-white shadow-lg shadow-primary-500/30">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-secondary-900">{title}</h3>
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  </motion.div>
);

export default function UsuarioForm({
  initialData,
  pessoasFisicas,
  pessoasJuridicas,
  onSubmit,
  onCancel,
  loading = false,
}: UsuarioFormProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Inicializar dados se for edição
  useEffect(() => {
    if (initialData) {
      setFormData({
        login: initialData.login,
        email: initialData.email,
        senha: "", // Não preencher senha na edição
        confirmarSenha: "",
        grupoAcesso: initialData.grupoAcesso,
        tipoPessoa: initialData.tipoPessoa,
        pessoaFisicaId: initialData.pessoaFisicaId?.toString() || "",
        pessoaJuridicaId: initialData.pessoaJuridicaId?.toString() || "",
        ativo: initialData.ativo,
      });
    }
  }, [initialData]);

  const handleFieldChange = useCallback(
    (field: string, value: string | boolean) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));

      // Limpar ID da pessoa quando mudar o tipo
      if (field === "tipoPessoa") {
        setFormData((prev) => ({
          ...prev,
          pessoaFisicaId: "",
          pessoaJuridicaId: "",
        }));
      }

      // Limpar erro do campo
      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [errors]
  );

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validações básicas
    if (!formData.login.trim()) newErrors.login = "Login é obrigatório";
    if (!formData.email.trim()) {
      newErrors.email = "E-mail é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "E-mail inválido";
    }

    // Validação de senha apenas para criação ou se foi preenchida na edição
    if (!initialData || formData.senha) {
      if (!formData.senha) {
        newErrors.senha = "Senha é obrigatória";
      } else if (formData.senha.length < 6) {
        newErrors.senha = "Senha deve ter pelo menos 6 caracteres";
      }

      if (formData.senha !== formData.confirmarSenha) {
        newErrors.confirmarSenha = "As senhas não coincidem";
      }
    }

    if (!formData.grupoAcesso)
      newErrors.grupoAcesso = "Grupo de acesso é obrigatório";
    if (!formData.tipoPessoa)
      newErrors.tipoPessoa = "Tipo de pessoa é obrigatório";

    // Validação da pessoa selecionada
    if (formData.tipoPessoa === "Fisica" && !formData.pessoaFisicaId) {
      newErrors.pessoaFisicaId = "Pessoa física é obrigatória";
    } else if (
      formData.tipoPessoa === "Juridica" &&
      !formData.pessoaJuridicaId
    ) {
      newErrors.pessoaJuridicaId = "Pessoa jurídica é obrigatória";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submitData: CreateUsuarioDTO = {
      login: formData.login,
      email: formData.email,
      senha: formData.senha,
      grupoAcesso: formData.grupoAcesso,
      tipoPessoa: formData.tipoPessoa,
      pessoaFisicaId:
        formData.tipoPessoa === "Fisica"
          ? parseInt(formData.pessoaFisicaId)
          : undefined,
      pessoaJuridicaId:
        formData.tipoPessoa === "Juridica"
          ? parseInt(formData.pessoaJuridicaId)
          : undefined,
    };

    if (initialData) {
      const updateData: UpdateUsuarioDTO = {
        ...submitData,
        id: initialData.id,
        ativo: formData.ativo,
      };
      // Se for edição e a senha estiver vazia, não enviar
      if (!formData.senha) {
        updateData.senha = initialData.senha;
      }
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

  // Converter pessoas para formato de opções
  const pessoaFisicaOptions = pessoasFisicas.map((p) => ({
    value: p.id.toString(),
    label: `${p.nome} - CPF: ${p.cpf}`,
  }));

  const pessoaJuridicaOptions = pessoasJuridicas.map((p) => ({
    value: p.id.toString(),
    label: `${p.razaoSocial} - CNPJ: ${p.cnpj}`,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-gradient-to-br from-secondary-50 via-white to-primary-50 rounded-3xl p-8 shadow-2xl backdrop-blur-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <div className="p-4 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl text-white shadow-xl shadow-primary-500/30">
            <UserCheck className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
              {initialData ? "Editar Usuário" : "Novo Usuário"}
            </h2>
            <p className="text-secondary-600 mt-1">
              Cadastre um usuário para acesso ao sistema
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

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Dados de Acesso */}
        <FormSection
          title="Dados de Acesso"
          icon={<Key className="w-6 h-6" />}
          delay={0.1}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="Login"
              name="login"
              required
              value={formData.login}
              onChange={(value) => handleFieldChange("login", value)}
              error={errors.login}
              icon={<User className="w-5 h-5" />}
              description="Nome de usuário para acessar o sistema"
            />
            <InputField
              label="E-mail"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={(value) => handleFieldChange("email", value)}
              error={errors.email}
              icon={<Mail className="w-5 h-5" />}
            />
            <InputField
              label={initialData ? "Nova Senha" : "Senha"}
              name="senha"
              type="password"
              required={!initialData}
              value={formData.senha}
              onChange={(value) => handleFieldChange("senha", value)}
              error={errors.senha}
              icon={<Lock className="w-5 h-5" />}
              description={
                initialData
                  ? "Deixe em branco para manter a senha atual"
                  : "Mínimo 6 caracteres"
              }
            />
            <InputField
              label="Confirmar Senha"
              name="confirmarSenha"
              type="password"
              required={!initialData || !!formData.senha}
              value={formData.confirmarSenha}
              onChange={(value) => handleFieldChange("confirmarSenha", value)}
              error={errors.confirmarSenha}
              icon={<Lock className="w-5 h-5" />}
            />
          </div>
        </FormSection>

        {/* Permissões e Vinculação */}
        <FormSection
          title="Permissões e Vinculação"
          icon={<Shield className="w-6 h-6" />}
          delay={0.2}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="Grupo de Acesso"
              name="grupoAcesso"
              options={GrupoAcessoOptions}
              required
              value={formData.grupoAcesso}
              onChange={(value) => handleFieldChange("grupoAcesso", value)}
              error={errors.grupoAcesso}
              icon={<Shield className="w-5 h-5" />}
              description="Define as permissões do usuário no sistema"
            />
            <InputField
              label="Tipo de Pessoa"
              name="tipoPessoa"
              options={TipoPessoaOptions}
              required
              value={formData.tipoPessoa}
              onChange={(value) => handleFieldChange("tipoPessoa", value)}
              error={errors.tipoPessoa}
              icon={<Users className="w-5 h-5" />}
              description="Tipo de pessoa vinculada ao usuário"
            />

            {formData.tipoPessoa === "Fisica" && (
              <InputField
                label="Pessoa Física"
                name="pessoaFisicaId"
                options={pessoaFisicaOptions}
                required
                value={formData.pessoaFisicaId}
                onChange={(value) => handleFieldChange("pessoaFisicaId", value)}
                error={errors.pessoaFisicaId}
                icon={<User className="w-5 h-5" />}
                description="Selecione a pessoa física vinculada"
              />
            )}

            {formData.tipoPessoa === "Juridica" && (
              <InputField
                label="Pessoa Jurídica"
                name="pessoaJuridicaId"
                options={pessoaJuridicaOptions}
                required
                value={formData.pessoaJuridicaId}
                onChange={(value) =>
                  handleFieldChange("pessoaJuridicaId", value)
                }
                error={errors.pessoaJuridicaId}
                icon={<Building2 className="w-5 h-5" />}
                description="Selecione a pessoa jurídica vinculada"
              />
            )}

            {initialData && (
              <InputField
                label="Usuário Ativo"
                name="ativo"
                type="checkbox"
                value={formData.ativo}
                onChange={(value) => handleFieldChange("ativo", value)}
              />
            )}
          </div>
        </FormSection>

        {/* Botões */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex justify-end gap-4 pt-8"
        >
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
              "px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-2xl",
              "hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-all duration-300 font-semibold shadow-xl hover:shadow-2xl",
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
