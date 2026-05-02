// Configuração de ambiente para o frontend
export const config = {
  // Ambiente atual
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT || "development",

  // Configurações específicas por ambiente
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",

  // Configurações de debug
  enableDebug: process.env.NODE_ENV === "development",

  // Timeout das requisições (em ms)
  requestTimeout: 30000,
};

// Browser: proxy same-origin `/api/backend/*` → .NET (cookie `bff_session`).
// Servidor Node (import sem `window`): URL direta do backend para módulos server-only.
export const getApiUrl = (): string => {
  if (typeof window !== "undefined") {
    return "/api/backend";
  }
  return (
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5101/api"
  );
};

// Função para verificar se está em desenvolvimento
export const isDevelopment = (): boolean => {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_ENVIRONMENT === "development"
  );
};
