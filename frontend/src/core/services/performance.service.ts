/**
 * Serviço de monitoramento de performance
 */

export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export class PerformanceService {
  private static instance: PerformanceService;
  private metrics: PerformanceMetric[] = [];
  private marks: Map<string, number> = new Map();

  private constructor() {
    this.setupPerformanceObserver();
  }

  static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  /**
   * Configurar Performance Observer
   */
  private setupPerformanceObserver() {
    if (typeof window === "undefined" || !window.PerformanceObserver) return;

    try {
      // Observar navegação
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric({
            name: entry.name,
            duration: entry.duration,
            timestamp: entry.startTime,
            metadata: {
              type: entry.entryType,
            },
          });
        }
      });

      observer.observe({ entryTypes: ["navigation", "resource", "measure"] });
    } catch (error) {
      console.warn("Performance Observer not supported:", error);
    }
  }

  /**
   * Iniciar medição
   */
  startMeasure(name: string) {
    this.marks.set(name, performance.now());
  }

  /**
   * Finalizar medição
   */
  endMeasure(name: string, metadata?: Record<string, any>) {
    const startTime = this.marks.get(name);
    if (!startTime) {
      console.warn(`No start mark found for: ${name}`);
      return;
    }

    const duration = performance.now() - startTime;
    this.marks.delete(name);

    this.recordMetric({
      name,
      duration,
      timestamp: Date.now(),
      metadata,
    });

    // Log em desenvolvimento
    if (process.env.NODE_ENV === "development") {
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`, metadata);
    }

    return duration;
  }

  /**
   * Registrar métrica
   */
  private recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);

    // Manter apenas últimas 100 métricas
    if (this.metrics.length > 100) {
      this.metrics.shift();
    }

    // Alertar se performance ruim
    if (metric.duration > 1000) {
      console.warn(
        `⚠️ Slow operation detected: ${metric.name} (${metric.duration}ms)`
      );
    }
  }

  /**
   * Obter métricas
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Obter métricas por nome
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter((m) => m.name === name);
  }

  /**
   * Obter estatísticas
   */
  getStats(name?: string) {
    const metrics = name ? this.getMetricsByName(name) : this.metrics;

    if (metrics.length === 0) {
      return null;
    }

    const durations = metrics.map((m) => m.duration);
    const sum = durations.reduce((a, b) => a + b, 0);
    const avg = sum / durations.length;
    const min = Math.min(...durations);
    const max = Math.max(...durations);

    return {
      count: metrics.length,
      avg: Math.round(avg * 100) / 100,
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      total: Math.round(sum * 100) / 100,
    };
  }

  /**
   * Limpar métricas
   */
  clearMetrics() {
    this.metrics = [];
    this.marks.clear();
  }

  /**
   * Medir tempo de execução de função
   */
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    this.startMeasure(name);
    try {
      const result = await fn();
      this.endMeasure(name, metadata);
      return result;
    } catch (error) {
      this.endMeasure(name, { ...metadata, error: true });
      throw error;
    }
  }

  /**
   * Medir tempo de execução de função síncrona
   */
  measure<T>(name: string, fn: () => T, metadata?: Record<string, any>): T {
    this.startMeasure(name);
    try {
      const result = fn();
      this.endMeasure(name, metadata);
      return result;
    } catch (error) {
      this.endMeasure(name, { ...metadata, error: true });
      throw error;
    }
  }

  /**
   * Obter métricas Web Vitals
   */
  getWebVitals() {
    if (typeof window === "undefined") return null;

    const navigation = performance.getEntriesByType(
      "navigation"
    )[0] as PerformanceNavigationTiming;

    if (!navigation) return null;

    return {
      // Time to First Byte
      ttfb: Math.round(navigation.responseStart - navigation.requestStart),

      // DOM Content Loaded
      dcl: Math.round(
        navigation.domContentLoadedEventEnd -
          navigation.domContentLoadedEventStart
      ),

      // Load Complete
      load: Math.round(navigation.loadEventEnd - navigation.loadEventStart),

      // Total Load Time
      total: Math.round(navigation.loadEventEnd - navigation.fetchStart),
    };
  }
}

// Export singleton
export const performanceMonitor = PerformanceService.getInstance();

/**
 * Hook para medir performance de componentes
 */
export function usePerformance(componentName: string) {
  const measure = (actionName: string, metadata?: Record<string, any>) => {
    const fullName = `${componentName}.${actionName}`;
    return {
      start: () => performanceMonitor.startMeasure(fullName),
      end: () => performanceMonitor.endMeasure(fullName, metadata),
    };
  };

  return { measure, performanceMonitor };
}
