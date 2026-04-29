// src/hooks/useRetry.ts
import { useState, useCallback } from "react";

interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: boolean; // Exponential backoff
  onRetry?: (attempt: number, error: any) => void;
}

interface RetryState {
  isRetrying: boolean;
  attemptCount: number;
  lastError: any | null;
}

/**
 * Hook para retry de operações assíncronas
 * Útil para requisições que podem falhar temporariamente
 *
 * @example
 * ```typescript
 * const { executeWithRetry, isRetrying } = useRetry();
 *
 * const fetchData = async () => {
 *   return await executeWithRetry(
 *     () => apiClient.get('/data'),
 *     { maxAttempts: 3, delay: 1000, backoff: true }
 *   );
 * };
 * ```
 */
export function useRetry() {
  const [state, setState] = useState<RetryState>({
    isRetrying: false,
    attemptCount: 0,
    lastError: null,
  });

  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const executeWithRetry = useCallback(
    async <T>(
      operation: () => Promise<T>,
      options: RetryOptions = {}
    ): Promise<T> => {
      const {
        maxAttempts = 3,
        delay = 1000,
        backoff = true,
        onRetry,
      } = options;

      let lastError: any;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          setState({
            isRetrying: attempt > 1,
            attemptCount: attempt,
            lastError: null,
          });

          const result = await operation();

          // Sucesso - resetar estado
          setState({
            isRetrying: false,
            attemptCount: 0,
            lastError: null,
          });

          return result;
        } catch (error) {
          lastError = error;

          // Última tentativa - lançar erro
          if (attempt === maxAttempts) {
            setState({
              isRetrying: false,
              attemptCount: attempt,
              lastError: error,
            });
            throw error;
          }

          // Callback de retry
          if (onRetry) {
            onRetry(attempt, error);
          }

          // Calcular delay com backoff exponencial opcional
          const currentDelay = backoff
            ? delay * Math.pow(2, attempt - 1)
            : delay;

          console.warn(
            `Tentativa ${attempt}/${maxAttempts} falhou. Tentando novamente em ${currentDelay}ms...`,
            error
          );

          // Aguardar antes da próxima tentativa
          await sleep(currentDelay);
        }
      }

      // TypeScript satisfeito - nunca chegará aqui
      throw lastError;
    },
    []
  );

  const reset = useCallback(() => {
    setState({
      isRetrying: false,
      attemptCount: 0,
      lastError: null,
    });
  }, []);

  return {
    executeWithRetry,
    isRetrying: state.isRetrying,
    attemptCount: state.attemptCount,
    lastError: state.lastError,
    reset,
  };
}

/**
 * Função standalone para retry (sem hook)
 * Útil para uso fora de componentes React
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxAttempts = 3, delay = 1000, backoff = true, onRetry } = options;

  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts) {
        throw error;
      }

      if (onRetry) {
        onRetry(attempt, error);
      }

      const currentDelay = backoff ? delay * Math.pow(2, attempt - 1) : delay;

      console.warn(
        `Tentativa ${attempt}/${maxAttempts} falhou. Tentando novamente em ${currentDelay}ms...`,
        error
      );

      await sleep(currentDelay);
    }
  }

  throw lastError;
}
