/**
 * Logger condicional - só loga em desenvolvimento
 */

const isDevelopment = process.env.NODE_ENV === "development";

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },

  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  error: (...args: any[]) => {
    // Sempre logar erros, mas sem detalhes sensíveis em produção
    if (isDevelopment) {
      console.error(...args);
    } else {
      console.error("Erro na aplicação. Verifique os logs do servidor.");
    }
  },

  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
};

// Exportar como default também
export default logger;
