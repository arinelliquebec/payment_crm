import { useState, useCallback } from "react";
import { Contrato } from "@/types/api";
import { getApiUrl } from "../../env.config";

interface AnalysisResult {
  success: boolean;
  contratoId: number;
  analise: string;
  timestamp: string;
}

interface UseContractAnalysisReturn {
  analyzing: boolean;
  analysis: string | null;
  error: string | null;
  analyzeContract: (
    contrato: Contrato,
    additionalText?: string
  ) => Promise<void>;
  clearAnalysis: () => void;
}

function getUsuarioId(): string {
  try {
    const userStr = localStorage.getItem("user");
    if (!userStr) return "";
    const userData = JSON.parse(userStr);
    const id =
      userData.UsuarioId ||
      userData.usuarioId ||
      userData.id ||
      userData.Id ||
      userData.userId;
    return id ? id.toString() : "";
  } catch {
    return "";
  }
}

export function useContractAnalysis(): UseContractAnalysisReturn {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeContract = useCallback(
    async (contrato: Contrato, additionalText?: string) => {
      setAnalyzing(true);
      setError(null);
      setAnalysis(null);

      try {
        const apiUrl = getApiUrl();
        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error("Usuário não autenticado");
        }

        const usuarioId = getUsuarioId();
        if (!usuarioId) {
          throw new Error("Sessão expirada. Faça login novamente.");
        }

        const response = await fetch(
          `${apiUrl}/Contrato/${contrato.id}/analisar`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              "X-Usuario-Id": usuarioId,
            },
          }
        );

        if (!response.ok) {
          let errorMsg = "Erro ao analisar contrato";
          try {
            const data = await response.json();
            if (data && typeof data === "object" && "mensagem" in data) {
              errorMsg = data.mensagem;
            } else if (typeof data === "string") {
              errorMsg = data;
            }
          } catch {
            errorMsg = `Erro do servidor (${response.status})`;
          }
          throw new Error(errorMsg);
        }

        const data: AnalysisResult = await response.json();

        if (data.analise) {
          setAnalysis(data.analise);
        }
      } catch (err: any) {
        console.error("Erro na análise:", err);
        setError(err.message || "Erro ao analisar contrato");
      } finally {
        setAnalyzing(false);
      }
    },
    []
  );

  const clearAnalysis = useCallback(() => {
    setAnalysis(null);
    setError(null);
  }, []);

  return {
    analyzing,
    analysis,
    error,
    analyzeContract,
    clearAnalysis,
  };
}
