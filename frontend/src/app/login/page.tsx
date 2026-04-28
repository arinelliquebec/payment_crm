// src/app/login/page.tsx
"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  LogIn,
  UserPlus,
  Shield,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface LoginFormData {
  cpf: string;
  senha: string;
}

interface LoginErrors {
  cpf?: string;
  senha?: string;
  general?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { login: authLogin, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState<LoginFormData>({
    cpf: "",
    senha: "",
  });

  const [errors, setErrors] = useState<LoginErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  // Handlers
  const handleInputChange = useCallback(
    (field: keyof LoginFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Limpar erro do campo quando começar a digitar
      if (errors[field as keyof LoginErrors]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors]
  );

  const validateForm = (): boolean => {
    const newErrors: LoginErrors = {};

    // Validar CPF
    const cpfLimpo = formData.cpf.replace(/\D/g, "");
    if (!formData.cpf.trim()) {
      newErrors.cpf = "CPF é obrigatório";
    } else if (cpfLimpo.length !== 11) {
      newErrors.cpf = "CPF deve ter 11 dígitos";
    }

    // Validar senha
    if (!formData.senha.trim()) {
      newErrors.senha = "Senha é obrigatória";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setErrors({});

    try {
      const isValid = validateForm();
      if (!isValid) {
        setLoading(false);
        return;
      }

      // Fazer login usando o contexto
      const result = await authLogin({
        login: formData.cpf.replace(/\D/g, ""), // Enviar apenas números
        senha: formData.senha,
      });

      if (result.success) {
        // Redirecionar para dashboard
        router.push("/dashboard");
      } else {
        setErrors({ general: result.error || "Erro ao fazer login" });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Building2 className="w-10 h-10 text-primary-600" />
          </motion.div>

          <h1 className="text-4xl font-bold text-neutral-800 mb-2">
            CRM ARRIGHI
          </h1>

          <p className="text-neutral-600">
            Sistema de Gestão de Relacionamento com Clientes
          </p>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-premium-lg p-8"
        >
          {/* Header do Card */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <LogIn className="w-8 h-8 text-primary-600" />
            </motion.div>

            <h2 className="text-2xl font-bold text-neutral-800 mb-2">
              Fazer Login
            </h2>

            <p className="text-neutral-600">
              Entre com suas credenciais para acessar o sistema
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

            {/* CPF */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-700">
                CPF *
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="text"
                  value={formData.cpf}
                  onChange={(e) => handleInputChange("cpf", e.target.value)}
                  placeholder="Digite seu CPF"
                  className={cn(
                    "w-full h-12 pl-12 pr-4 bg-white/80 backdrop-blur-sm rounded-xl",
                    "border-2 transition-all duration-300",
                    "focus:outline-none focus:ring-4",
                    "placeholder:text-neutral-400",
                    errors.cpf
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                      : "border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20 hover:border-neutral-300"
                  )}
                />
              </div>
              {errors.cpf && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-600 flex items-center gap-1"
                >
                  <AlertCircle className="w-4 h-4" />
                  {errors.cpf}
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
                    "w-full h-12 pl-12 pr-12 bg-white/80 backdrop-blur-sm rounded-xl",
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
                    Entrando...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <LogIn className="w-5 h-5" />
                    Entrar
                  </div>
                )}
              </motion.button>
            </div>
          </form>

          {/* Link para cadastro */}
          <div className="mt-8 text-center">
            <p className="text-neutral-600 text-sm mb-4">
              Ainda não tem uma conta?
            </p>
            <Link
              href="/cadastro"
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Criar conta
            </Link>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-8"
        >
          <div className="flex items-center justify-center gap-2 text-neutral-500 text-sm">
            <Shield className="w-4 h-4" />
            Sistema seguro e protegido
          </div>
          <p className="text-neutral-400 text-xs mt-2">
            © 2024 CRM Arrighi. Todos os direitos reservados.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
