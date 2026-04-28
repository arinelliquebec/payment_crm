// src/components/ProtectedRoute.tsx
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";
import { Loader2, Shield } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string; // Para futuras implementações de níveis de acesso
}

export default function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-800 mb-2">
            Verificando autenticação...
          </h2>
          <p className="text-neutral-600">Aguarde um momento</p>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado, não renderizar nada (redirecionamento já foi feito)
  if (!isAuthenticated) {
    return null;
  }

  // Verificar nível de acesso se especificado
  if (
    requiredRole &&
    user?.grupoAcesso !== requiredRole &&
    user?.grupoAcesso !== "Administrador"
  ) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-3xl shadow-lg p-8 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-800 mb-2">
            Acesso Negado
          </h2>
          <p className="text-neutral-600 mb-6">
            Você não tem permissão para acessar esta página.
          </p>
          <button
            onClick={() => router.back()}
            className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
