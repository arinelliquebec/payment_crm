"use client";

import React from "react";
import {
  useCanAccessScreen,
  useIsScreenHidden,
  useCanAccessModule,
  useIsModuleHidden,
  useGroupCharacteristics,
} from "@/hooks/useGroupAccess";
import { Loader2, Shield, AlertTriangle } from "lucide-react";

interface GroupAccessGuardProps {
  screenName: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showLoading?: boolean;
  showError?: boolean;
}

/**
 * Guard que protege componentes baseado no grupo de acesso
 */
export const GroupAccessGuard: React.FC<GroupAccessGuardProps> = ({
  screenName,
  children,
  fallback,
  showLoading = true,
  showError = true,
}) => {
  const { canAccess, loading: accessLoading } = useCanAccessScreen(screenName);
  const { isHidden, loading: hiddenLoading } = useIsScreenHidden(screenName);

  const loading = accessLoading || hiddenLoading;

  if (loading && showLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
        <span className="ml-2 text-gray-600">Verificando permissões...</span>
      </div>
    );
  }

  if (isHidden || !canAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <Shield className="h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Acesso Negado
          </h2>
          <p className="text-gray-600 mb-4">
            Você não tem permissão para acessar esta tela.
          </p>
          <div className="flex items-center text-sm text-gray-500">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <span>
              Entre em contato com o administrador para solicitar acesso.
            </span>
          </div>
        </div>
      );
    }

    return null;
  }

  return <>{children}</>;
};

/**
 * Guard que protege módulos baseado no grupo de acesso
 */
interface ModuleAccessGuardProps {
  moduleName: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showLoading?: boolean;
  showError?: boolean;
}

export const ModuleAccessGuard: React.FC<ModuleAccessGuardProps> = ({
  moduleName,
  children,
  fallback,
  showLoading = true,
  showError = true,
}) => {
  const { canAccess, loading: accessLoading } = useCanAccessModule(moduleName);
  const { isHidden, loading: hiddenLoading } = useIsModuleHidden(moduleName);

  const loading = accessLoading || hiddenLoading;

  if (loading && showLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
        <span className="ml-2 text-gray-600">Verificando permissões...</span>
      </div>
    );
  }

  if (isHidden || !canAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <Shield className="h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Módulo Restrito
          </h2>
          <p className="text-gray-600 mb-4">
            Você não tem permissão para acessar este módulo.
          </p>
          <div className="flex items-center text-sm text-gray-500">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <span>
              Entre em contato com o administrador para solicitar acesso.
            </span>
          </div>
        </div>
      );
    }

    return null;
  }

  return <>{children}</>;
};

/**
 * Guard que verifica se o usuário tem grupo válido
 */
interface ValidGroupGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showLoading?: boolean;
  showError?: boolean;
}

export const ValidGroupGuard: React.FC<ValidGroupGuardProps> = ({
  children,
  fallback,
  showLoading = true,
  showError = true,
}) => {
  const { characteristics, loading } = useGroupCharacteristics();

  if (loading && showLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
        <span className="ml-2 text-gray-600">
          Verificando grupo de acesso...
        </span>
      </div>
    );
  }

  if (!characteristics.hasValidGroup) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <Shield className="h-16 w-16 text-amber-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Grupo de Acesso Necessário
          </h2>
          <p className="text-gray-600 mb-4">
            Você precisa ser alocado em um grupo de acesso para usar o sistema.
          </p>
          <div className="flex items-center text-sm text-gray-500">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <span>
              Entre em contato com o administrador para ser alocado em um grupo.
            </span>
          </div>
        </div>
      );
    }

    return null;
  }

  return <>{children}</>;
};

/**
 * Componente que mostra informações do grupo de acesso
 */
export const GroupInfo: React.FC = () => {
  const { characteristics, loading } = useGroupCharacteristics();

  if (loading) {
    return (
      <div className="flex items-center">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        <span className="text-sm text-gray-500">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Grupo de Acesso
      </h3>
      <div className="space-y-2">
        <div>
          <span className="font-medium text-gray-700">Grupo:</span>
          <span className="ml-2 text-gray-900">
            {characteristics.groupName}
          </span>
        </div>
        <div>
          <span className="font-medium text-gray-700">Descrição:</span>
          <span className="ml-2 text-gray-600">
            {characteristics.groupDescription}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {characteristics.isFilialOnly && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              Apenas Filial
            </span>
          )}
          {characteristics.isReadOnly && (
            <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">
              Somente Leitura
            </span>
          )}
          {characteristics.shouldHideUsersTab && (
            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
              Usuários Ocultos
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
