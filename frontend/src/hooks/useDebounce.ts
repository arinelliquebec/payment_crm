// src/hooks/useDebounce.ts
import { useEffect, useState } from "react";

/**
 * Hook para debounce de valores
 * Útil para evitar execuções excessivas em validações e buscas
 *
 * @param value - Valor a ser "debounced"
 * @param delay - Delay em milissegundos (padrão: 500ms)
 * @returns Valor após o delay
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Criar timer para atualizar o valor após o delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpar timer se o valor mudar antes do delay
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook para callback com debounce
 * Útil para funções que não precisam retornar valor
 *
 * @param callback - Função a ser executada
 * @param delay - Delay em milissegundos (padrão: 500ms)
 * @returns Função com debounce aplicado
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500
): (...args: Parameters<T>) => void {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    const newTimeoutId = setTimeout(() => {
      callback(...args);
    }, delay);

    setTimeoutId(newTimeoutId);
  };
}
