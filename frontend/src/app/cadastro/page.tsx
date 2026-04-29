// src/app/cadastro/page.tsx
"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
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
  cpf: string;
  senha: string;
  confirmarSenha: string;
}

interface FormErrors {
  cpf?: string;
  senha?: string;
  confirmarSenha?: string;
  general?: string;
}

interface PessoaFisicaApiResponse {
  id: number;
  nome: string;
  cpf: string;
  emailEmpresarial?: string | null;
  emailPessoal?: string | null;
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

export default function CadastroPage() {
  const [formData, setFormData] = useState<FormData>({
    cpf: "",
    senha: "",
    confirmarSenha: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [, setPessoaFisicaInfo] = useState<PessoaFisicaApiResponse | null>(
    null
  );

  // Validação de CPF
  const validateCPF = (cpf: string): boolean => {
    const cleanCPF = cpf.replace(/\D/g, "");

    if (cleanCPF.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(10))) return false;

    return true;
  };

  // Formatação de CPF
  const formatCPF = (value: string): string => {
    const cleaned = value.replace(/\D/g, "");
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{3})(\d{2})$/);
    if (match) {
      return `${match[1]}.${match[2]}.${match[3]}-${match[4]}`;
    }
    return cleaned;
  };

  // Validação da senha
  const validatePassword = (password: string): boolean => {
    return passwordRequirements.every((req) => req.test(password));
  };

  // Verificar CPF no banco de dados (verifica se já tem USUÁRIO com esse CPF)
  const checkCPFExists = async (
    cpf: string
  ): Promise<{ exists: boolean; message?: string }> => {
    try {
      const cleanCPF = cpf.replace(/\D/g, "");
      const response = await apiClient.get<{
        disponivel: boolean;
        motivo: string;
        mensagem: string;
      }>(`/Usuario/verificar-cpf-disponivel/${cleanCPF}`);

      if (response.error || !response.data) {
        return { exists: false };
      }

      // Se não está disponível, significa que já existe usuário
      if (!response.data.disponivel) {
        return {
          exists: true,
          message: response.data.mensagem,
        };
      }

      return { exists: false };
    } catch (error) {
      return { exists: false };
    }
  };

  // Handlers
  const handleInputChange = useCallback(
    (field: keyof FormData, value: string) => {
      if (field === "cpf") {
        value = formatCPF(value);
        setPessoaFisicaInfo(null);
      }

      setFormData((prev) => ({ ...prev, [field]: value }));

      // Limpar erro do campo quando começar a digitar
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors]
  );

  const fetchPessoaFisicaByCpf = async (
    cpf: string
  ): Promise<PessoaFisicaApiResponse | null> => {
    try {
      const cleanCPF = cpf.replace(/\D/g, "");
      const response = await apiClient.get<PessoaFisicaApiResponse | undefined>(
        `/PessoaFisica/buscar-por-cpf/${cleanCPF}`
      );

      if (response.error || !response.data) {
        return null;
      }

      const pessoa = response.data;
      return {
        id: (pessoa as any).id ?? (pessoa as any).Id ?? pessoa.id,
        nome: (pessoa as any).nome ?? (pessoa as any).Nome ?? "",
        cpf: (pessoa as any).cpf ?? (pessoa as any).Cpf ?? cleanCPF,
        emailEmpresarial:
          (pessoa as any).emailEmpresarial ?? (pessoa as any).EmailEmpresarial,
        emailPessoal:
          (pessoa as any).emailPessoal ?? (pessoa as any).EmailPessoal,
      };
    } catch (error) {
      return null;
    }
  };

  const validateForm = async (): Promise<{
    isValid: boolean;
    pessoaFisica?: PessoaFisicaApiResponse | null;
  }> => {
    const newErrors: FormErrors = {};
    let pessoaFisicaEncontrada: PessoaFisicaApiResponse | null = null;

    // Validar CPF
    if (!formData.cpf.trim()) {
      newErrors.cpf = "CPF é obrigatório";
    } else if (!validateCPF(formData.cpf)) {
      newErrors.cpf = "CPF inválido";
    } else {
      // Verificar se CPF já tem USUÁRIO cadastrado no sistema
      const cpfCheck = await checkCPFExists(formData.cpf);
      if (cpfCheck.exists) {
        newErrors.cpf =
          cpfCheck.message ||
          "CPF já cadastrado no sistema. Faça login ou recupere sua senha.";
      } else {
        pessoaFisicaEncontrada = await fetchPessoaFisicaByCpf(formData.cpf);
        if (!pessoaFisicaEncontrada) {
          newErrors.cpf =
            "CPF não encontrado como Pessoa Física. Verifique se o cadastro existe no sistema.";
        }
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

    setPessoaFisicaInfo(pessoaFisicaEncontrada);
    setErrors(newErrors);
    return {
      isValid: Object.keys(newErrors).length === 0,
      pessoaFisica: pessoaFisicaEncontrada,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setErrors({});

    try {
      const { isValid, pessoaFisica } = await validateForm();
      if (!isValid || !pessoaFisica) {
        if (isValid && !pessoaFisica) {
          setErrors({
            general:
              "Não foi possível localizar os dados da Pessoa Física. Verifique o CPF ou contate o suporte.",
          });
        }
        setLoading(false);
        return;
      }

      // Aqui você implementaria a criação do usuário
      const cleanCPF = formData.cpf.replace(/\D/g, "");
      const emailParaCadastro =
        pessoaFisica.emailEmpresarial ||
        pessoaFisica.emailPessoal ||
        `${cleanCPF}@temp.com`;

      // Criar usuário usando o endpoint correto
      const response = await apiClient.post("/Usuario/create", {
        Login: cleanCPF,
        Email: emailParaCadastro,
        Senha: formData.senha,
        TipoPessoa: "Fisica",
        PessoaFisicaId: pessoaFisica.id,
        PessoaJuridicaId: null,
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
      <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(212,175,55,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl opacity-30" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-neutral-900/95 backdrop-blur-xl rounded-3xl shadow-xl border border-neutral-800 p-8 w-full max-w-md text-center relative z-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30"
          >
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </motion.div>

          <h1 className="text-2xl font-bold text-neutral-50 mb-4">
            Cadastro Realizado!
          </h1>

          <p className="text-neutral-400 mb-8">
            Sua conta foi criada com sucesso. Você já pode fazer login no
            sistema.
          </p>

          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-neutral-950 px-6 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-amber-500/20"
          >
            Fazer Login
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(212,175,55,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl opacity-30 animate-pulse"
          style={{ animationDuration: "4s" }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl opacity-20 animate-pulse"
          style={{ animationDuration: "6s", animationDelay: "2s" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-neutral-900/95 backdrop-blur-xl rounded-3xl shadow-xl border border-neutral-800 p-8 w-full max-w-md relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/30"
          >
            <UserPlus className="w-8 h-8 text-amber-400" />
          </motion.div>

          <h1 className="text-3xl font-bold text-neutral-50 mb-2">
            Criar Conta
          </h1>

          <p className="text-neutral-400">
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
                className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-300">{errors.general}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CPF */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-300">
              CPF *
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
              <input
                type="text"
                value={formData.cpf}
                onChange={(e) => handleInputChange("cpf", e.target.value)}
                placeholder="000.000.000-00"
                maxLength={14}
                className={cn(
                  "w-full h-12 pl-12 pr-4 bg-neutral-800/50 backdrop-blur-sm rounded-xl text-neutral-100",
                  "border-2 transition-all duration-300",
                  "focus:outline-none focus:ring-4",
                  "placeholder:text-neutral-500",
                  errors.cpf
                    ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                    : "border-neutral-700 focus:border-amber-500 focus:ring-amber-500/20 hover:border-neutral-600"
                )}
              />
            </div>
            {errors.cpf && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-400 flex items-center gap-1"
              >
                <AlertCircle className="w-4 h-4" />
                {errors.cpf}
              </motion.p>
            )}
          </div>

          {/* Senha */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-300">
              Senha *
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
              <input
                type={showPassword ? "text" : "password"}
                value={formData.senha}
                onChange={(e) => handleInputChange("senha", e.target.value)}
                placeholder="Digite sua senha"
                className={cn(
                  "w-full h-12 pl-12 pr-12 bg-neutral-800/50 backdrop-blur-sm rounded-xl text-neutral-100",
                  "border-2 transition-all duration-300",
                  "focus:outline-none focus:ring-4",
                  "placeholder:text-neutral-500",
                  errors.senha
                    ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                    : "border-neutral-700 focus:border-amber-500 focus:ring-amber-500/20 hover:border-neutral-600"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-amber-400 transition-colors"
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
                        isValid ? "text-green-400" : "text-neutral-500"
                      )}
                    >
                      <CheckCircle2
                        className={cn(
                          "w-4 h-4 transition-colors",
                          isValid ? "text-green-400" : "text-neutral-600"
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
                className="text-sm text-red-400 flex items-center gap-1"
              >
                <AlertCircle className="w-4 h-4" />
                {errors.senha}
              </motion.p>
            )}
          </div>

          {/* Confirmar Senha */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-300">
              Confirmar Senha *
            </label>
            <div className="relative">
              <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmarSenha}
                onChange={(e) =>
                  handleInputChange("confirmarSenha", e.target.value)
                }
                placeholder="Confirme sua senha"
                className={cn(
                  "w-full h-12 pl-12 pr-12 bg-neutral-800/50 backdrop-blur-sm rounded-xl text-neutral-100",
                  "border-2 transition-all duration-300",
                  "focus:outline-none focus:ring-4",
                  "placeholder:text-neutral-500",
                  errors.confirmarSenha
                    ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                    : "border-neutral-700 focus:border-amber-500 focus:ring-amber-500/20 hover:border-neutral-600"
                )}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-amber-400 transition-colors"
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
                className="text-sm text-red-400 flex items-center gap-1"
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
                "focus:outline-none focus:ring-4 focus:ring-amber-500/20",
                loading
                  ? "bg-neutral-700 cursor-not-allowed text-neutral-500"
                  : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-neutral-950 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30"
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
              className="w-full h-12 rounded-xl border-2 border-neutral-700 hover:border-amber-500/50 text-neutral-300 hover:text-amber-400 font-medium transition-colors flex items-center justify-center gap-2"
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
