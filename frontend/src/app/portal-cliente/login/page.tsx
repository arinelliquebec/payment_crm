"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Building2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Phone,
  Mail,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  useClienteAuth,
  getTipoDocumento,
  cleanDocumento,
} from "@/contexts/ClienteAuthContext";

export default function PortalClienteLoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading, error, clearError } =
    useClienteAuth();
  const [documento, setDocumento] = useState("");
  const [tipoDoc, setTipoDoc] = useState<"CPF" | "CNPJ" | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/portal-cliente");
    }
  }, [isAuthenticated, router]);

  // Focar no input ao carregar
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Atualizar tipo do documento conforme digitação
  useEffect(() => {
    const cleaned = cleanDocumento(documento);
    if (cleaned.length <= 11) {
      setTipoDoc(cleaned.length === 11 ? "CPF" : null);
    } else if (cleaned.length <= 14) {
      setTipoDoc(cleaned.length === 14 ? "CNPJ" : null);
    }
  }, [documento]);

  // Formatar documento ao digitar
  const handleDocumentoChange = (value: string) => {
    clearError();
    const cleaned = value.replace(/\D/g, "");

    if (cleaned.length <= 11) {
      // Formato CPF: 000.000.000-00
      let formatted = cleaned;
      if (cleaned.length > 3) {
        formatted = cleaned.slice(0, 3) + "." + cleaned.slice(3);
      }
      if (cleaned.length > 6) {
        formatted = formatted.slice(0, 7) + "." + formatted.slice(7);
      }
      if (cleaned.length > 9) {
        formatted = formatted.slice(0, 11) + "-" + formatted.slice(11);
      }
      setDocumento(formatted);
    } else if (cleaned.length <= 14) {
      // Formato CNPJ: 00.000.000/0000-00
      let formatted = cleaned;
      if (cleaned.length > 2) {
        formatted = cleaned.slice(0, 2) + "." + cleaned.slice(2);
      }
      if (cleaned.length > 5) {
        formatted = formatted.slice(0, 6) + "." + formatted.slice(6);
      }
      if (cleaned.length > 8) {
        formatted = formatted.slice(0, 10) + "/" + formatted.slice(10);
      }
      if (cleaned.length > 12) {
        formatted = formatted.slice(0, 15) + "-" + formatted.slice(15);
      }
      setDocumento(formatted);
    }
  };

  // Submeter login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tipoDoc) {
      return;
    }

    const success = await login(documento);
    if (success) {
      router.push("/portal-cliente");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-center p-4">
      {/* Botão Voltar para Dashboard */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        onClick={() => router.push("/dashboard")}
        className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-neutral-800/50 hover:bg-neutral-700/50 border border-neutral-700 hover:border-amber-500/30 text-neutral-300 hover:text-amber-400 rounded-lg transition-all group z-10"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        <span className="text-sm font-medium">Dashboard</span>
      </motion.button>

      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        {/* Card de Login */}
        <div className="bg-neutral-900/95 backdrop-blur-xl rounded-2xl border border-neutral-800 shadow-2xl shadow-black/50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 p-8 text-center border-b border-neutral-800">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl shadow-lg shadow-amber-500/30 mb-4"
            >
              <Shield className="w-10 h-10 text-neutral-950" />
            </motion.div>
            <h1 className="text-2xl font-bold text-gradient-amber mb-2">
              Portal do Cliente
            </h1>
            <p className="text-neutral-400 text-sm">
              CRM JURÍDICO • Arrighi Advogados
            </p>
          </div>

          {/* Form */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informativo */}
              <div className="bg-neutral-800/50 rounded-xl p-4 border border-neutral-700/50">
                <p className="text-sm text-neutral-300 text-center">
                  Digite o{" "}
                  <span className="text-amber-400 font-semibold">CNPJ</span> da
                  sua empresa para acessar o portal
                </p>
              </div>

              {/* Input do Documento */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-300">
                  CNPJ da Empresa
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Building2 className="w-5 h-5 text-amber-500" />
                  </div>
                  <input
                    ref={inputRef}
                    type="text"
                    value={documento}
                    onChange={(e) => handleDocumentoChange(e.target.value)}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    className={cn(
                      "w-full pl-12 pr-4 py-4 bg-neutral-800/50 border rounded-xl text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 transition-all text-lg tracking-wide",
                      error
                        ? "border-red-500/50 focus:ring-red-500/50"
                        : tipoDoc
                        ? "border-green-500/50 focus:ring-green-500/50"
                        : "border-neutral-700 focus:ring-amber-500/50"
                    )}
                  />
                  {tipoDoc && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                    >
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </motion.div>
                  )}
                </div>

                {/* Indicador de Tipo */}
                <AnimatePresence mode="wait">
                  {tipoDoc && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-xs text-green-400 flex items-center gap-1"
                    >
                      <CheckCircle className="w-3 h-3" />
                      {tipoDoc === "CPF" ? "Pessoa Física" : "Empresa"}{" "}
                      identificada
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Erro */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
                  >
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-300">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Botão de Submit */}
              <motion.button
                type="submit"
                disabled={!tipoDoc || isLoading}
                whileHover={{ scale: tipoDoc && !isLoading ? 1.02 : 1 }}
                whileTap={{ scale: tipoDoc && !isLoading ? 0.98 : 1 }}
                className={cn(
                  "w-full flex items-center justify-center gap-3 py-4 rounded-xl text-lg font-semibold transition-all",
                  tipoDoc && !isLoading
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-neutral-950 shadow-lg shadow-amber-500/30"
                    : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    Acessar Portal
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Ajuda */}
            <div className="mt-6 pt-6 border-t border-neutral-800">
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="w-full flex items-center justify-center gap-2 text-sm text-neutral-400 hover:text-amber-400 transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                {showHelp ? "Ocultar ajuda" : "Precisa de ajuda?"}
              </button>

              <AnimatePresence>
                {showHelp && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 space-y-3 overflow-hidden"
                  >
                    <div className="bg-neutral-800/50 rounded-lg p-4 space-y-3">
                      <p className="text-xs text-neutral-400">
                        Para acessar o portal, utilize o CNPJ da sua empresa
                        cadastrado em seu contrato com a Arrighi Advogados.
                      </p>
                      <div className="flex items-center gap-2 text-xs text-neutral-300">
                        <Phone className="w-3.5 h-3.5 text-amber-500" />
                        <span>(11) 3000-0000</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-neutral-300">
                        <Mail className="w-3.5 h-3.5 text-amber-500" />
                        <span>contato@arrighiadvogados.com.br</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-neutral-600 mt-6"
        >
          © {new Date().getFullYear()} Arrighi Advogados. Todos os direitos
          reservados.
        </motion.p>
      </motion.div>
    </div>
  );
}
