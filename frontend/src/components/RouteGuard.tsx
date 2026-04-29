"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigationFilter } from "@/hooks/useNavigationFilter";
import { Shield, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

interface RouteGuardProps {
  children: React.ReactNode;
}

export default function RouteGuard({ children }: RouteGuardProps) {
  const { isAuthenticated, isLoading, permissoes } = useAuth();
  const { canAccessRoute, isUsuarioGroup } = useNavigationFilter();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Se não está carregando e não está autenticado, redirecionar para login
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    // Se está autenticado mas não pode acessar a rota
    if (isAuthenticated && permissoes && !canAccessRoute(pathname)) {
      // Se é grupo Usuario tentando acessar rota protegida, redirecionar para dashboard
      if (isUsuarioGroup) {
        router.push("/dashboard");
        return;
      }

      // Para outros grupos, também redirecionar para dashboard
      router.push("/dashboard");
    }
  }, [
    isAuthenticated,
    isLoading,
    permissoes,
    pathname,
    canAccessRoute,
    isUsuarioGroup,
    router,
  ]);

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-300 font-medium">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  // Se não está autenticado, não renderizar nada (será redirecionado)
  if (!isAuthenticated) {
    return null;
  }

  // Se não tem permissões ainda, mostrar loading
  if (!permissoes) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-300 font-medium">
            Carregando permissões...
          </p>
        </div>
      </div>
    );
  }

  // Se não pode acessar a rota, mostrar tela de acesso negado temporariamente
  if (!canAccessRoute(pathname)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-neutral-900/95 backdrop-blur-xl rounded-2xl shadow-xl border border-neutral-800 p-8 text-center"
        >
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
            <Shield className="w-8 h-8 text-red-400" />
          </div>

          <h1 className="text-2xl font-bold text-neutral-50 mb-2">
            Acesso Negado
          </h1>

          <p className="text-neutral-400 mb-6">
            {isUsuarioGroup
              ? "Seu grupo de acesso permite apenas o dashboard principal."
              : "Você não tem permissão para acessar esta página."}
          </p>

          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push("/dashboard")}
              className="w-full px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-neutral-950 rounded-lg font-medium transition-colors shadow-lg shadow-amber-500/20"
            >
              Ir para Dashboard
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.back()}
              className="w-full px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg font-medium transition-colors border border-neutral-700"
            >
              Voltar
            </motion.button>
          </div>

          {isUsuarioGroup && (
            <div className="mt-6 p-3 bg-orange-500/20 border border-orange-500/30 rounded-lg">
              <div className="flex items-center justify-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                <p className="text-xs text-orange-300 font-medium">
                  Grupo: {permissoes.grupo} - Acesso Limitado
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  // Se chegou até aqui, pode renderizar o conteúdo
  return <>{children}</>;
}
