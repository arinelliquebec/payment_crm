import { useState, useEffect, useCallback } from "react";

interface HealthCheckData {
  [key: string]: string | number | boolean | object;
}

interface HealthCheck {
  name: string;
  status: "Healthy" | "Degraded" | "Unhealthy";
  description: string;
  duration: string;
  data: HealthCheckData;
  exception?: string;
}

interface HealthStatus {
  status: "Healthy" | "Degraded" | "Unhealthy";
  timestamp: string;
  duration: string;
  checks: HealthCheck[];
}

export function useHealthStatus(refreshInterval: number = 30000) {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      // Usar a URL do backend diretamente (remover /api se presente)
      let baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";
      // Health check está em /health, não /api/health
      baseUrl = baseUrl.replace(/\/api\/?$/, "");
      const response = await fetch(`${baseUrl}/health/details`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setHealth(data);
      setError(null);
    } catch (err) {
      console.error("Erro ao buscar health status:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      // Criar um status offline
      setHealth({
        status: "Unhealthy",
        timestamp: new Date().toISOString(),
        duration: "0ms",
        checks: [
          {
            name: "backend",
            status: "Unhealthy",
            description: "Backend não disponível",
            duration: "0ms",
            data: {},
            exception: err instanceof Error ? err.message : "Erro de conexão",
          },
        ],
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();

    const interval = setInterval(fetchHealth, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchHealth, refreshInterval]);

  return { health, loading, error, refetch: fetchHealth };
}

