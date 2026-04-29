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
import { loginSchema, type LoginFormData } from "@/lib/validation/schemas";
import { useFormValidation } from "@/hooks/useFormValidation";
import { sanitizeInput, sanitizeCPF } from "@/lib/validation/sanitize";

export default function LoginPage() {
  const router = useRouter();
  const { login: authLogin, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState<LoginFormData>({
    cpf: "",
    senha: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [generalError, setGeneralError] = useState<string>();

  // Validação em tempo real com Zod
  const validation = useFormValidation(loginSchema, {
    validateOnChange: true,
    validateOnBlur: true,
    debounceMs: 500,
  });

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  // Handlers
  const handleInputChange = useCallback(
    (field: keyof LoginFormData, value: string) => {
      // Sanitizar input
      const sanitizedValue = field === "cpf"
        ? sanitizeCPF(value)
        : sanitizeInput(value, "text");

      const newFormData = { ...formData, [field]: sanitizedValue };
      setFormData(newFormData);

      // Validar em tempo real
      validation.handleChange(field, sanitizedValue, newFormData);

      // Limpar erro geral
      if (generalError) {
        setGeneralError(undefined);
      }
    },
    [formData, validation, generalError]
  );

  const handleBlur = useCallback(
    (field: keyof LoginFormData) => {
      validation.handleBlur(field, formData[field], formData);
    },
    [formData, validation]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setGeneralError(undefined);

    try {
      // Marcar todos os campos como tocados
      validation.touchAll(formData);

      // Validar todos os campos
      const isValid = await validation.validateAll(formData);

      if (!isValid) {
        setLoading(false);
        return;
      }

      // Sanitizar dados antes de enviar
      const sanitizedData = {
        login: sanitizeCPF(formData.cpf),
        senha: sanitizeInput(formData.senha, "text"),
      };

      // Fazer login usando o contexto
      const result = await authLogin(sanitizedData);

      if (result.success) {
        // Redirecionar para dashboard
        router.push("/dashboard");
      } else {
        setGeneralError(result.error || "Erro ao fazer login");
      }
    } catch (error) {
      setGeneralError(
        "Erro interno. Tente novamente ou entre em contato com o suporte."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(212,175,55,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl opacity-30 animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
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
            className="w-20 h-20 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/30"
          >
            <Building2 className="w-10 h-10 text-neutral-950" />
          </motion.div>

          <h1 className="text-4xl font-bold text-gradient-amber mb-2">
            CRM ARRIGHI
          </h1>

          <p className="text-neutral-400">
            Sistema de Gestão de Relacionamento com Clientes
          </p>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-neutral-900/95 backdrop-blur-xl rounded-3xl shadow-xl border border-neutral-800 p-8"
        >
          {/* Header do Card */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/30"
            >
              <LogIn className="w-8 h-8 text-amber-400" />
            </motion.div>

            <h2 className="text-2xl font-bold text-neutral-50 mb-2">
              Fazer Login
            </h2>

            <p className="text-neutral-400">
              Entre com suas credenciais para acessar o sistema
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Erro geral */}
            <AnimatePresence>
              {generalError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 flex items-center gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-300">{generalError}</p>
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
                  onBlur={() => handleBlur("cpf")}
                  placeholder="Digite seu CPF"
                  maxLength={14}
                  className={cn(
                    "w-full h-12 pl-12 pr-4 bg-neutral-800/50 backdrop-blur-sm rounded-xl",
                    "border-2 transition-all duration-300 text-neutral-100",
                    "focus:outline-none focus:ring-4",
                    "placeholder:text-neutral-500",
                    validation.hasFieldError("cpf")
                      ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                      : "border-neutral-700 focus:border-amber-500 focus:ring-amber-500/20 hover:border-neutral-600"
                  )}
                />
              </div>
              <AnimatePresence>
                {validation.getFieldError("cpf") && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-sm text-red-400 flex items-center gap-1"
                  >
                    <AlertCircle className="w-4 h-4" />
                    {validation.getFieldError("cpf")}
                  </motion.p>
                )}
              </AnimatePresence>
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
                  onBlur={() => handleBlur("senha")}
                  placeholder="Digite sua senha"
                  maxLength={100}
                  className={cn(
                    "w-full h-12 pl-12 pr-12 bg-neutral-800/50 backdrop-blur-sm rounded-xl",
                    "border-2 transition-all duration-300 text-neutral-100",
                    "focus:outline-none focus:ring-4",
                    "placeholder:text-neutral-500",
                    validation.hasFieldError("senha")
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
              <AnimatePresence>
                {validation.getFieldError("senha") && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-sm text-red-400 flex items-center gap-1"
                  >
                    <AlertCircle className="w-4 h-4" />
                    {validation.getFieldError("senha")}
                  </motion.p>
                )}
              </AnimatePresence>
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
            <p className="text-neutral-400 text-sm mb-4">
              Ainda não tem uma conta?
            </p>
            <Link
              href="/cadastro"
              className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 font-medium transition-colors"
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
          <div className="flex items-center justify-center gap-2 text-neutral-400 text-sm">
            <Shield className="w-4 h-4 text-amber-400" />
            Sistema seguro e protegido
          </div>
          <p className="text-neutral-500 text-xs mt-2">
            © 2025 CRM Arrighi. Todos os direitos reservados.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
