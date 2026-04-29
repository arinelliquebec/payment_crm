/**
 * Code Splitting Utilities
 * Helpers para lazy loading e code splitting
 */

import { lazy, ComponentType, LazyExoticComponent } from "react";
import { LoadingState } from "../components/feedback/LoadingState";

/**
 * Lazy load com retry automático
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  retries = 3,
  interval = 1000
): LazyExoticComponent<T> {
  return lazy(() => {
    return new Promise<{ default: T }>((resolve, reject) => {
      const attemptImport = (retriesLeft: number) => {
        componentImport()
          .then(resolve)
          .catch((error) => {
            if (retriesLeft === 0) {
              reject(error);
              return;
            }

            setTimeout(() => {
              console.log(`Retrying import... (${retriesLeft} attempts left)`);
              attemptImport(retriesLeft - 1);
            }, interval);
          });
      };

      attemptImport(retries);
    });
  });
}

/**
 * Lazy load com preload
 */
export function lazyWithPreload<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
) {
  const LazyComponent = lazy(componentImport);

  // Adiciona método preload
  (LazyComponent as any).preload = componentImport;

  return LazyComponent as LazyExoticComponent<T> & {
    preload: () => Promise<{ default: T }>;
  };
}

/**
 * Preload de múltiplos componentes
 */
export function preloadComponents(
  components: Array<{ preload: () => Promise<any> }>
): Promise<any[]> {
  return Promise.all(components.map((component) => component.preload()));
}

/**
 * Lazy load com loading customizado
 */
export function lazyWithLoading<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  LoadingComponent: ComponentType = () => <LoadingState size="lg" />
) {
  const LazyComponent = lazy(componentImport);

  return {
    Component: LazyComponent,
    Loading: LoadingComponent,
  };
}

/**
 * Route-based code splitting helper
 */
export const routes = {
  clientes: lazyWithPreload(
    () => import("@/features/clientes/pages/ClientesPage")
  ),
  contratos: lazyWithPreload(
    () => import("@/features/contratos/pages/ContratosPage")
  ),
  dashboard: lazyWithPreload(
    () => import("@/features/dashboard/pages/DashboardPage")
  ),
} as const;

/**
 * Preload on hover
 */
export function usePreloadOnHover(component: { preload: () => Promise<any> }) {
  return {
    onMouseEnter: () => component.preload(),
    onFocus: () => component.preload(),
  };
}
