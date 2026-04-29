"use client";

import React from "react";
import { useAuthCheck } from "@/hooks/useAuthCheck";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, User, AlertTriangle, CheckCircle } from "lucide-react";

/**
 * Componente de debug para problemas de autenticação
 * Use apenas em desenvolvimento
 */
export const AuthDebug: React.FC = () => {
  const { isAuthenticated, userId, userData, isLoading } = useAuthCheck();
  const { user, permissoes, permissoesLoading } = useAuth();

  // Só mostrar em desenvolvimento
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
      <div className="flex items-center mb-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 mr-2" />
        <h3 className="text-amber-800 font-medium">Debug de Autenticação</h3>
      </div>

      <div className="space-y-2 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>AuthCheck Hook:</strong>
            <ul className="ml-4 mt-1">
              <li>Loading: {isLoading ? "Sim" : "Não"}</li>
              <li>Autenticado: {isAuthenticated ? "Sim" : "Não"}</li>
              <li>User ID: {userId || "N/A"}</li>
            </ul>
          </div>

          <div>
            <strong>AuthContext:</strong>
            <ul className="ml-4 mt-1">
              <li>User: {user ? "Sim" : "Não"}</li>
              <li>Permissões Loading: {permissoesLoading ? "Sim" : "Não"}</li>
              <li>Permissões: {permissoes ? "Sim" : "Não"}</li>
            </ul>
          </div>
        </div>

        <div>
          <strong>Dados do Usuário (localStorage):</strong>
          <pre className="bg-gray-100 p-2 rounded text-xs mt-1 overflow-auto">
            {JSON.stringify(userData, null, 2)}
          </pre>
        </div>

        <div>
          <strong>Dados do Contexto:</strong>
          <pre className="bg-gray-100 p-2 rounded text-xs mt-1 overflow-auto">
            {JSON.stringify(
              {
                user: user
                  ? {
                      id: user.id,
                      login: user.login,
                      email: user.email,
                      grupoAcesso: user.grupoAcesso,
                    }
                  : null,
                permissoes: permissoes
                  ? {
                      usuarioId: permissoes.usuarioId,
                      nome: permissoes.nome,
                      grupo: permissoes.grupo,
                      semPermissao: permissoes.semPermissao,
                    }
                  : null,
              },
              null,
              2
            )}
          </pre>
        </div>

        <div>
          <strong>localStorage:</strong>
          <ul className="ml-4 mt-1">
            <li>
              isAuthenticated:{" "}
              {typeof window !== "undefined"
                ? localStorage.getItem("isAuthenticated")
                : "N/A"}
            </li>
            <li>
              user:{" "}
              {typeof window !== "undefined"
                ? localStorage.getItem("user")
                  ? "Presente"
                  : "Ausente"
                : "N/A"}
            </li>
            <li>
              token:{" "}
              {typeof window !== "undefined"
                ? localStorage.getItem("token")
                  ? "Presente"
                  : "Ausente"
                : "N/A"}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

/**
 * Componente para mostrar status de autenticação de forma simples
 */
export const AuthStatus: React.FC = () => {
  const { isAuthenticated, userId, isLoading } = useAuthCheck();
  const { permissoes } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center text-gray-500">
        <Shield className="h-4 w-4 mr-2 animate-pulse" />
        <span className="text-sm">Verificando autenticação...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center text-red-600">
        <AlertTriangle className="h-4 w-4 mr-2" />
        <span className="text-sm">Não autenticado</span>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="flex items-center text-amber-600">
        <AlertTriangle className="h-4 w-4 mr-2" />
        <span className="text-sm">ID do usuário não encontrado</span>
      </div>
    );
  }

  if (permissoes?.semPermissao) {
    return (
      <div className="flex items-center text-orange-600">
        <AlertTriangle className="h-4 w-4 mr-2" />
        <span className="text-sm">Sem permissões</span>
      </div>
    );
  }

  return (
    <div className="flex items-center text-green-600">
      <CheckCircle className="h-4 w-4 mr-2" />
      <span className="text-sm">Autenticado e com permissões</span>
    </div>
  );
};
