"use client";

import { motion, AnimatePresence } from "framer-motion";
import Header from "./Header";
import { useForm } from "@/contexts/FormContext";
import { Calendar, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { useClientes } from "@/hooks/useClientes";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Loader2, Shield } from "lucide-react";
import { useSessaoTracker } from "@/hooks/useSessaoTracker";
import { AssistenteIA } from "./chat/AssistenteIA";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { isFormOpen } = useForm();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // Hook para rastrear página atual na sessão
  useSessaoTracker();

  // Hook para dados de clientes
  const { clientes, loading: clientesLoading } = useClientes();

  // Verificar autenticação - redirecionar para login se não autenticado
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Contagem de clientes ativos
  // O backend já retorna apenas clientes com Ativo = true (soft delete filter)
  // Então todos os clientes retornados são clientes ativos no sistema
  const clientesAtivos = clientes.length;

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-50 mb-2">
            Verificando autenticação...
          </h2>
          <p className="text-neutral-400">Aguarde um momento</p>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado, não renderizar nada (redirecionamento já foi feito)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      {/* Background Pattern - Futurista */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(212,175,55,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=&quot;60&quot; height=&quot;60&quot; viewBox=&quot;0 0 60 60&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
      </div>

      {/* Top Info Bar - Premium Dark Style */}
      <AnimatePresence>
        {!isFormOpen && (
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-r from-neutral-900 to-neutral-950 text-neutral-300 py-1.5 px-4 text-xs border-b border-neutral-800"
          >
            <div className="max-w-[1920px] mx-auto flex items-center justify-between">
              <div className="flex items-center gap-6">
                <span className="font-medium text-amber-400">
                  Arrighi Advogados © 2025
                </span>
                <span className="text-neutral-600">|</span>
                <span>CRM JURÍDICO v2.0</span>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span className="capitalize">
                    {currentTime ? formatDate(currentTime) : ""}
                  </span>
                </div>
                <span className="text-neutral-600">|</span>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-mono">
                    {currentTime ? formatTime(currentTime) : ""}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <AnimatePresence>
        {!isFormOpen && (
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            transition={{ duration: 0.3 }}
          >
            <Header />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 pt-[68px]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className={cn("max-w-[1920px] mx-auto", isFormOpen ? "py-4" : "py-8")}
        >
          {/* Content Container with Executive Styling */}
          <div
            className={cn(
              "px-4 sm:px-6 lg:px-8",
              !isFormOpen ? "space-y-6" : ""
            )}
          >
            {/* Breadcrumb Area - quando não estiver em formulário */}
            {!isFormOpen && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-sm text-neutral-400"
              >
                <span className="font-medium text-amber-400">Home</span>
                <span>/</span>
                <span>Dashboard</span>
              </motion.div>
            )}

            {/* Main Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {children}
            </motion.div>
          </div>
        </motion.div>
      </main>

      {/* Footer - Premium Dark Style */}
      <AnimatePresence>
        {!isFormOpen && (
          <motion.footer
            initial={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ duration: 0.3 }}
            className="relative z-5 mt-auto"
          >
            {/* Footer Gradient Line */}
            <div className="h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />

            <div className="bg-neutral-900/80 backdrop-blur-sm border-t border-neutral-800">
              <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Company Info */}
                  <div>
                    <h4 className="text-sm font-bold text-amber-400 mb-2">
                      Arrighi Advogados
                    </h4>
                    <p className="text-xs text-neutral-400">
                      Sistema de Gestão de Relacionamento com Cliente
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      Desenvolvido para excelência em atendimento jurídico
                    </p>
                  </div>

                  {/* Quick Stats */}
                  <div className="flex items-center justify-center gap-8">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-amber-400">
                        {clientesLoading ? (
                          <span className="animate-pulse">...</span>
                        ) : (
                          clientesAtivos
                        )}
                      </p>
                      <p className="text-xs text-neutral-400">
                        Clientes Ativos
                      </p>
                    </div>
                    <div className="w-px h-12 bg-neutral-700" />
                    <div className="text-center">
                      <p className="text-2xl font-bold text-amber-400">99.9%</p>
                      <p className="text-xs text-neutral-400">
                        Disponibilidade
                      </p>
                    </div>
                    <div className="w-px h-12 bg-neutral-700" />
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-400">24/7</p>
                      <p className="text-xs text-neutral-400">Suporte</p>
                    </div>
                  </div>

                  {/* Legal & Support */}
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-4 mb-2">
                      <a
                        href="#"
                        className="text-xs text-neutral-400 hover:text-amber-400 transition-colors"
                      >
                        Termos de Uso
                      </a>
                      <span className="text-neutral-600">|</span>
                      <a
                        href="#"
                        className="text-xs text-neutral-400 hover:text-amber-400 transition-colors"
                      >
                        Privacidade
                      </a>
                      <span className="text-neutral-600">|</span>
                      <a
                        href="#"
                        className="text-xs text-neutral-400 hover:text-amber-400 transition-colors"
                      >
                        Suporte
                      </a>
                    </div>
                    <p className="text-xs text-neutral-500">
                      © 2025 Arrighi Advogados. Todos os direitos reservados.
                    </p>
                    <p className="text-xs text-neutral-600 mt-1">
                      ISO 27001 Certified | LGPD Compliant
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.footer>
        )}
      </AnimatePresence>

      {/* Assistente de IA */}
      <AssistenteIA />
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}
