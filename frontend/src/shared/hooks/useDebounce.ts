import { useEffect, useState } from "react";

/**
 * Hook para debounce de valores
 * Útil para search inputs, filtros, etc.
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Exemplo de uso:
 *
 * function SearchComponent() {
 *   const [search, setSearch] = useState("");
 *   const debouncedSearch = useDebounce(search, 500);
 *
 *   const { data } = useClientes({ search: debouncedSearch });
 *
 *   return (
 *     <input
 *       value={search}
 *       onChange={(e) => setSearch(e.target.value)}
 *       placeholder="Buscar..."
 *     />
 *   );
 * }
 */
