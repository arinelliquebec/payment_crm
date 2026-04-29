// Configuração de ambiente para o frontend
export const config = {
  // URL do BFF NestJS
  bffUrl: process.env.NEXT_PUBLIC_BFF_URL || "http://localhost:3001",

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

// Retorna a URL base do BFF NestJS
export const getBffUrl = (): string => {
  // Em produção na Vercel, usa o rewrite /bff → BFF externo
  if (process.env.NEXT_PUBLIC_BFF_URL) {
    return process.env.NEXT_PUBLIC_BFF_URL;
  }

  // Fallback local de desenvolvimento
  return "http://localhost:3001";
};

// Mantida para compatibilidade com código legado (redireciona ao BFF)
export const getApiUrl = (): string => {
  const bff = getBffUrl();
  return `${bff}/api`;
};

// Função para verificar se está em desenvolvimento
export const isDevelopment = (): boolean => {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_ENVIRONMENT === "development"
  );
};
