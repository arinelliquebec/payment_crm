import { useState, useCallback } from "react";

interface PermissionError {
  hasError: boolean;
  error?: string;
  retry: () => void;
  clearError: () => void;
  setPermissionError: (errorMessage: string) => void;
}

/**
 * Hook para gerenciar erros de permissões
 */
export function usePermissionError(): PermissionError {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const retry = useCallback(() => {
    setHasError(false);
    setError(undefined);
  }, []);

  const clearError = useCallback(() => {
    setHasError(false);
    setError(undefined);
  }, []);

  const setPermissionError = useCallback((errorMessage: string) => {
    setHasError(true);
    setError(errorMessage);
  }, []);

  return {
    hasError,
    error,
    retry,
    clearError,
    setPermissionError,
  };
}

/**
 * Hook para verificar se um erro é relacionado a permissões
 */
export function usePermissionErrorHandler() {
  const handlePermissionError = useCallback((error: any): boolean => {
    if (!error) return false;

    const errorMessage = error.message || error.toString();

    // Verificar se é um erro relacionado a permissões
    const permissionErrorKeywords = [
      "sessões ativas",
      "sessao",
      "permissão",
      "permissao",
      "autorização",
      "autorizacao",
      "acesso negado",
      "unauthorized",
      "forbidden",
      "permission denied",
    ];

    const isPermissionError = permissionErrorKeywords.some((keyword) =>
      errorMessage.toLowerCase().includes(keyword.toLowerCase())
    );

    if (isPermissionError) {
      console.warn("Erro de permissão detectado:", errorMessage);
      return true;
    }

    return false;
  }, []);

  return { handlePermissionError };
}
