// src/app/cadastro-cnpj/page.tsx
"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Shield,
  UserPlus,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api";
import Link from "next/link";

interface FormData {
  cnpj: string;
  senha: string;
  confirmarSenha: string;
}

interface FormErrors {
  cnpj?: string;
  senha?: string;
  confirmarSenha?: string;
  general?: string;
}

interface PasswordRequirement {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  {
    id: "length",
    label: "Mínimo 6 caracteres",
    test: (password) => password.length >= 6,
  },
  {
    id: "letter",
    label: "Pelo menos uma letra",
    test: (password) => /[a-zA-Z]/.test(password),
  },
  {
    id: "number",
    label: "Pelo menos um número",
    test: (password) => /[0-9]/.test(password),
  },
];

export default function CadastroCNPJPage() {
  const [formData, setFormData] = useState<FormData>({
    cnpj: "",
    senha: "",
    confirmarSenha: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  // Validação de CNPJ
  const validateCNPJ = (cnpj: string): boolean => {
    const cleanCNPJ = cnpj.replace(/\D/g, "");

    if (cleanCNPJ.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;

    let length = cleanCNPJ.length - 2;
    let numbers = cleanCNPJ.substring(0, length);
    const digits = cleanCNPJ.substring(length);
    let sum = 0;
    let pos = length - 7;

    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;

    length = length + 1;
    numbers = cleanCNPJ.substring(0, length);
    sum = 0;
    pos = length - 7;

    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(1))) return false;

    return true;
  };

  // Formatação de CNPJ
  const formatCNPJ = (value: string): string => {
    const cleaned = value.replace(/\D/g, "");
    const match = cleaned.match(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/);
    if (match) {
      return `${match[1]}.${match[2]}.${match[3]}/${match[4]}-${match[5]}`;
    }
    return cleaned;
  };

  // Validação da senha
  const validatePassword = (password: string): boolean => {
    return passwordRequirements.every((req) => req.test(password));
  };

  // Verificar CNPJ no banco de dados
  const checkCNPJExists = async (cnpj: string): Promise<boolean> => {
    try {
      const cleanCNPJ = cnpj.replace(/\D/g, "");
      const response = await apiClient.get(
        `/PessoaJuridica/buscar-por-cnpj/${cleanCNPJ}`
      );
      return !response.error && !!response.data;
    } catch (error) {
      return false;
    }
  };

  // Handlers
  const handleInputChange = useCallback(
    (field: keyof FormData, value: string) => {
      if (field === "cnpj") {
        value = formatCNPJ(value);
      }

      setFormData((prev) => ({ ...prev, [field]: value }));

      // Limpar erro do campo quando começar a digitar
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors]
  );

  const validateForm = async (): Promise<boolean> => {
    const newErrors: FormErrors = {};

    // Validar CNPJ
    if (!formData.cnpj.trim()) {
      newErrors.cnpj = "CNPJ é obrigatório";
    } else if (!validateCNPJ(formData.cnpj)) {
      newErrors.cnpj = "CNPJ inválido";
    } else {
      // Verificar se CNPJ já existe no sistema (para cadastro, não deve existir)
      const cnpjExists = await checkCNPJExists(formData.cnpj);
      if (cnpjExists) {
        newErrors.cnpj =
          "CNPJ já cadastrado no sistema. Faça login ou recupere sua senha.";
      }
    }

    // Validar senha
    if (!formData.senha.trim()) {
      newErrors.senha = "Senha é obrigatória";
    } else if (!validatePassword(formData.senha)) {
      newErrors.senha = "Senha não atende aos requisitos";
    }

    // Validar confirmação de senha
    if (!formData.confirmarSenha.trim()) {
      newErrors.confirmarSenha = "Confirmação de senha é obrigatória";
    } else if (formData.senha !== formData.confirmarSenha) {
      newErrors.confirmarSenha = "Senhas não coincidem";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setErrors({});

    try {
      const isValid = await validateForm();
      if (!isValid) {
        setLoading(false);
        return;
      }

      const cleanCNPJ = formData.cnpj.replace(/\D/g, "");

      // Criar usuário usando o endpoint correto
      const response = await apiClient.post("/Usuario/create", {
        Login: cleanCNPJ,
        Email: `${cleanCNPJ}@temp.com`, // Email temporário, será atualizado depois
        Senha: formData.senha,
        TipoPessoa: "Juridica",
        PessoaFisicaId: null,
        PessoaJuridicaId: null, // Será criado automaticamente se necessário
        FilialId: null,
        ConsultorId: null,
        GrupoAcessoId: null, // Usará grupo padrão "Usuario"
        Ativo: true,
      });

      if (response.error) {
        setErrors({ general: response.error });
      } else {
        setSuccess(true);
      }
    } catch (error) {
      setErrors({
        general:
          "Erro interno. Tente novamente ou entre em contato com o suporte.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-neutral-900/95 backdrop-blur-xl rounded-3xl shadow-premium-lg p-8 w-full max-w-md text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </motion.div>

          <h1 className="text-2xl font-bold text-neutral-800 mb-4">
            Cadastro Realizado!
          </h1>

          <p className="text-neutral-600 mb-8">
            Sua conta foi criada com sucesso. Você já pode fazer login no
            sistema.
          </p>

          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            Fazer Login
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-neutral-900/95 backdrop-blur-xl rounded-3xl shadow-premium-lg p-8 w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Building2 className="w-8 h-8 text-primary-600" />
          </motion.div>

          <h1 className="text-3xl font-bold text-neutral-800 mb-2">
            Criar Conta Empresarial
          </h1>

          <p className="text-neutral-600">
            Preencha os dados abaixo para criar sua conta
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Erro geral */}
          <AnimatePresence>
            {errors.general && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{errors.general}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CNPJ */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700">
              CNPJ *
            </label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                value={formData.cnpj}
                onChange={(e) => handleInputChange("cnpj", e.target.value)}
                placeholder="00.000.000/0000-00"
                maxLength={18}
                className={cn(
                  "w-full h-12 pl-12 pr-4 bg-neutral-900/95 backdrop-blur-xl rounded-xl",
                  "border-2 transition-all duration-300",
                  "focus:outline-none focus:ring-4",
                  "placeholder:text-neutral-400",
                  errors.cnpj
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                    : "border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20 hover:border-neutral-300"
                )}
              />
            </div>
            {errors.cnpj && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-600 flex items-center gap-1"
              >
                <AlertCircle className="w-4 h-4" />
                {errors.cnpj}
              </motion.p>
            )}
          </div>

          {/* Senha */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700">
              Senha *
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={formData.senha}
                onChange={(e) => handleInputChange("senha", e.target.value)}
                placeholder="Digite sua senha"
                className={cn(
                  "w-full h-12 pl-12 pr-12 bg-neutral-900/95 backdrop-blur-xl rounded-xl",
                  "border-2 transition-all duration-300",
                  "focus:outline-none focus:ring-4",
                  "placeholder:text-neutral-400",
                  errors.senha
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                    : "border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20 hover:border-neutral-300"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Requisitos da senha */}
            {formData.senha && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-2 mt-3"
              >
                {passwordRequirements.map((req) => {
                  const isValid = req.test(formData.senha);
                  return (
                    <div
                      key={req.id}
                      className={cn(
                        "flex items-center gap-2 text-sm transition-colors",
                        isValid ? "text-green-600" : "text-neutral-500"
                      )}
                    >
                      <CheckCircle2
                        className={cn(
                          "w-4 h-4 transition-colors",
                          isValid ? "text-green-500" : "text-neutral-300"
                        )}
                      />
                      {req.label}
                    </div>
                  );
                })}
              </motion.div>
            )}

            {errors.senha && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-600 flex items-center gap-1"
              >
                <AlertCircle className="w-4 h-4" />
                {errors.senha}
              </motion.p>
            )}
          </div>

          {/* Confirmar Senha */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700">
              Confirmar Senha *
            </label>
            <div className="relative">
              <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmarSenha}
                onChange={(e) =>
                  handleInputChange("confirmarSenha", e.target.value)
                }
                placeholder="Confirme sua senha"
                className={cn(
                  "w-full h-12 pl-12 pr-12 bg-neutral-900/95 backdrop-blur-xl rounded-xl",
                  "border-2 transition-all duration-300",
                  "focus:outline-none focus:ring-4",
                  "placeholder:text-neutral-400",
                  errors.confirmarSenha
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                    : "border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20 hover:border-neutral-300"
                )}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.confirmarSenha && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-600 flex items-center gap-1"
              >
                <AlertCircle className="w-4 h-4" />
                {errors.confirmarSenha}
              </motion.p>
            )}
          </div>

          {/* Botões */}
          <div className="space-y-4 pt-4">
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "w-full h-12 rounded-xl font-medium transition-all duration-300",
                "focus:outline-none focus:ring-4 focus:ring-primary-500/20",
                loading
                  ? "bg-neutral-300 cursor-not-allowed"
                  : "bg-primary-500 hover:bg-primary-600 text-white shadow-md hover:shadow-lg"
              )}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Criando conta...
                </div>
              ) : (
                "Criar Conta"
              )}
            </motion.button>

            <Link
              href="/"
              className="w-full h-12 rounded-xl border-2 border-neutral-200 hover:border-neutral-300 text-neutral-700 font-medium transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar ao Login
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
