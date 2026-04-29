"use client";

import React from "react";
import { Loader2, Shield } from "lucide-react";

interface PermissionLoadingProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Componente de loading para permissões
 */
export const PermissionLoading: React.FC<PermissionLoadingProps> = ({
  message = "Carregando permissões...",
  size = "md",
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "h-4 w-4";
      case "lg":
        return "h-8 w-8";
      default:
        return "h-6 w-6";
    }
  };

  return (
    <div className="flex items-center justify-center p-4">
      <div className="flex items-center space-x-2 text-gray-600">
        <Loader2 className={`${getSizeClasses()} animate-spin`} />
        <span className="text-sm">{message}</span>
      </div>
    </div>
  );
};

/**
 * Componente de loading para botões com permissões
 */
export const PermissionButtonLoading: React.FC = () => {
  return (
    <div className="flex items-center justify-center px-4 py-2 bg-gray-200 text-gray-500 rounded-lg cursor-not-allowed">
      <Loader2 className="h-4 w-4 animate-spin mr-2" />
      <span className="text-sm">Verificando...</span>
    </div>
  );
};

/**
 * Componente de loading para seções com permissões
 */
export const PermissionSectionLoading: React.FC<{
  message?: string;
  className?: string;
}> = ({ message = "Carregando seção...", className = "" }) => {
  return (
    <div
      className={`bg-gray-50 border border-gray-200 rounded-lg p-6 ${className}`}
    >
      <div className="flex items-center justify-center">
        <div className="flex items-center space-x-3 text-gray-600">
          <Shield className="h-5 w-5 animate-pulse" />
          <span className="text-sm">{message}</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Componente de loading para navegação
 */
export const NavigationLoading: React.FC = () => {
  return (
    <nav className="space-y-2">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded-lg"></div>
        </div>
      ))}
    </nav>
  );
};

/**
 * Componente de loading para status do usuário
 */
export const UserStatusLoading: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="h-6 bg-gray-200 rounded w-20"></div>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <div className="h-4 w-4 bg-gray-200 rounded mr-2"></div>
              <div>
                <div className="h-3 bg-gray-200 rounded w-16 mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="h-4 w-4 bg-gray-200 rounded mr-2"></div>
              <div>
                <div className="h-3 bg-gray-200 rounded w-16 mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
