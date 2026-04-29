/**
 * Performance Monitoring Utilities
 * Helpers para monitoramento de performance
 */

import { useEffect, useRef } from "react";

/**
 * Medir tempo de renderização
 */
export function measureRenderTime(componentName: string) {
  const startTime = performance.now();

  return () => {
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    if (renderTime > 16) {
      // > 16ms = < 60fps
      console.warn(
        `[Performance] ${componentName} render took ${renderTime.toFixed(2)}ms`
      );
    }
  };
}

/**
 * Hook para medir render time
 */
export function useRenderTime(componentName: string) {
  const renderCount = useRef(0);
  const startTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current++;
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;

    console.log(
      `[Performance] ${componentName} render #${
        renderCount.current
      }: ${renderTime.toFixed(2)}ms`
    );

    startTime.current = performance.now();
  });
}

/**
 * Hook para detectar re-renders desnecessários
 */
export function useWhyDidYouUpdate(name: string, props: Record<string, any>) {
  const previousProps = useRef<Record<string, any> | undefined>(undefined);

  useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps: Record<string, { from: any; to: any }> = {};

      allKeys.forEach((key) => {
        if (previousProps.current![key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current![key],
            to: props[key],
          };
        }
      });

      if (Object.keys(changedProps).length > 0) {
        console.log("[WhyDidYouUpdate]", name, changedProps);
      }
    }

    previousProps.current = props;
  }, [name, props]);
}

/**
 * Debounce para performance
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle para performance
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Memoização customizada
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  resolver?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = resolver ? resolver(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Performance observer para métricas
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  mark(name: string) {
    performance.mark(name);
  }

  measure(name: string, startMark: string, endMark: string) {
    try {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name)[0];

      if (!this.metrics.has(name)) {
        this.metrics.set(name, []);
      }

      this.metrics.get(name)!.push(measure.duration);

      // Limpar marcas antigas
      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
      performance.clearMeasures(name);
    } catch (error) {
      console.error("Error measuring performance:", error);
    }
  }

  getMetrics(name: string) {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) return null;

    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    return { avg, min, max, count: values.length };
  }

  getAllMetrics() {
    const result: Record<string, any> = {};
    this.metrics.forEach((_, name) => {
      result[name] = this.getMetrics(name);
    });
    return result;
  }

  clear() {
    this.metrics.clear();
    performance.clearMarks();
    performance.clearMeasures();
  }
}

/**
 * Hook para monitorar performance de componente
 */
export function usePerformanceMonitor(componentName: string) {
  const monitor = PerformanceMonitor.getInstance();

  useEffect(() => {
    monitor.mark(`${componentName}-start`);

    return () => {
      monitor.mark(`${componentName}-end`);
      monitor.measure(
        componentName,
        `${componentName}-start`,
        `${componentName}-end`
      );
    };
  });

  return {
    getMetrics: () => monitor.getMetrics(componentName),
  };
}

/**
 * Log de performance no console
 */
export function logPerformance() {
  const monitor = PerformanceMonitor.getInstance();
  const metrics = monitor.getAllMetrics();

  console.table(metrics);
}
