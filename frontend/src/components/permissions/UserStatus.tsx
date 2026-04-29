"use client";

import React from "react";
import { useCurrentUser } from "@/hooks/usePermissions";
import { useAuth } from "@/contexts/AuthContext";
import {
  Shield,
  User,
  Building,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { UserStatusLoading } from "./PermissionLoading";

/**
 * Componente para exibir o status do usuário e suas permissões
 */
export const UserStatus: React.FC = () => {
  const { usuario, loading, error } = useCurrentUser();
  const { refreshPermissions } = useAuth();

  if (loading) {
    return <UserStatusLoading />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
          <h3 className="text-red-800 font-medium">
            Erro ao carregar permissões
          </h3>
        </div>
        <p className="text-red-600 text-sm mt-2">{error}</p>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
          <h3 className="text-amber-800 font-medium">
            Usuário não encontrado
          </h3>
        </div>
      </div>
    );
  }

  const getStatusColor = () => {
    if (usuario.semPermissao) {
      return "text-red-600 bg-red-50 border-red-200";
    }
    return "text-green-600 bg-green-50 border-green-200";
  };

  const getStatusIcon = () => {
    if (usuario.semPermissao) {
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    }
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Status do Usuário
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={refreshPermissions}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Atualizar permissões"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <div
            className={`flex items-center px-3 py-1 rounded-full border ${getStatusColor()}`}
          >
            {getStatusIcon()}
            <span className="ml-2 text-sm font-medium">
              {usuario.semPermissao ? "Sem Permissões" : "Ativo"}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Informações básicas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center">
            <User className="h-4 w-4 text-gray-400 mr-2" />
            <div>
              <p className="text-sm text-gray-500">Nome</p>
              <p className="font-medium text-gray-900">{usuario.nome}</p>
            </div>
          </div>

          <div className="flex items-center">
            <Shield className="h-4 w-4 text-gray-400 mr-2" />
            <div>
              <p className="text-sm text-gray-500">Grupo</p>
              <p className="font-medium text-gray-900">{usuario.grupo}</p>
            </div>
          </div>

          {usuario.filial && (
            <div className="flex items-center">
              <Building className="h-4 w-4 text-gray-400 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Filial</p>
                <p className="font-medium text-gray-900">{usuario.filial}</p>
              </div>
            </div>
          )}
        </div>

        {/* Mensagem de status */}
        {usuario.semPermissao && usuario.mensagem && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
              <div>
                <h4 className="text-red-800 font-medium">Atenção</h4>
                <p className="text-red-600 text-sm mt-1">{usuario.mensagem}</p>
              </div>
            </div>
          </div>
        )}

        {/* Informações adicionais */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>ID do Usuário: {usuario.id}</span>
            <span>Login: {usuario.login}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Componente compacto para exibir apenas o grupo do usuário
 */
export const UserGroupBadge: React.FC = () => {
  const { usuario, loading } = useCurrentUser();

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-200 h-6 w-24 rounded-full"></div>
    );
  }

  if (!usuario) {
    return null;
  }

  const getGroupColor = (grupo: string) => {
    const colors: Record<string, string> = {
      Administrador: "bg-red-100 text-red-800 border-red-200",
      Faturamento: "bg-purple-100 text-purple-800 border-purple-200",
      "Gestor de Filial": "bg-orange-100 text-orange-800 border-orange-200",
      Consultores: "bg-blue-100 text-blue-800 border-blue-200",
      "Cobrança e Financeiro": "bg-green-100 text-green-800 border-green-200",
      "Cobrança/Financeiro": "bg-green-100 text-green-800 border-green-200",
      "Administrativo de Filial":
        "bg-amber-100 text-amber-800 border-amber-200",
      Usuario: "bg-gray-100 text-gray-800 border-gray-200",
      Usuário: "bg-gray-100 text-gray-800 border-gray-200",
    };

    return (
      colors[grupo] || "bg-neutral-100 text-neutral-800 border-neutral-200"
    );
  };

  return (
    <div
      className={`inline-flex items-center px-3 py-1 rounded-full border text-sm font-medium ${getGroupColor(
        usuario.grupo
      )}`}
    >
      <Shield className="h-3 w-3 mr-1" />
      {usuario.grupo}
    </div>
  );
};

/**
 * Componente para exibir informações da filial do usuário
 */
export const UserFilialInfo: React.FC = () => {
  const { usuario, loading } = useCurrentUser();

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-4 w-32 rounded"></div>;
  }

  if (!usuario || !usuario.filial) {
    return null;
  }

  return (
    <div className="flex items-center text-sm text-gray-600">
      <Building className="h-4 w-4 mr-1" />
      <span>{usuario.filial}</span>
    </div>
  );
};
