import { lazy, Suspense, ComponentType } from "react";
import { LoadingState } from "@/shared/components/feedback/LoadingState";

/**
 * Helper para lazy loading com loading state
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFn);

  return (props: React.ComponentProps<T>) => (
    <Suspense fallback={fallback || <LoadingState />}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

/**
 * Preload de componente lazy
 */
export function preloadComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  return importFn();
}

/**
 * Exemplo de uso:
 *
 * const ClientesPage = lazyLoad(() => import("@/features/clientes/pages/ClientesPage"));
 *
 * // Preload ao hover
 * <Link
 *   href="/clientes"
 *   onMouseEnter={() => preloadComponent(() => import("@/features/clientes/pages/ClientesPage"))}
 * >
 *   Clientes
 * </Link>
 */
