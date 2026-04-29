"use client";

import React, { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary para capturar erros relacionados a permissões
 */
export class PermissionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Atualiza o state para mostrar a UI de fallback
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      "Erro capturado pelo PermissionErrorBoundary:",
      error,
      errorInfo
    );
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      // UI de fallback personalizada
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <h3 className="text-red-800 font-medium">Erro de Permissões</h3>
          </div>
          <p className="text-red-600 text-sm mt-2">
            Ocorreu um erro ao carregar as permissões. Isso pode ser devido a:
          </p>
          <ul className="text-red-600 text-sm mt-2 list-disc list-inside">
            <li>Sessão expirada</li>
            <li>Problemas de conectividade</li>
            <li>Erro no servidor</li>
          </ul>
          <button
            onClick={this.handleRetry}
            className="mt-4 flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Componente wrapper para usar o Error Boundary de forma mais simples
 */
interface PermissionWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const PermissionErrorWrapper: React.FC<PermissionWrapperProps> = ({
  children,
  fallback,
}) => {
  return (
    <PermissionErrorBoundary fallback={fallback}>
      {children}
    </PermissionErrorBoundary>
  );
};
