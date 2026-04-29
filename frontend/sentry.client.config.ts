import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // ============================================================================
  // Performance Monitoring
  // ============================================================================

  // Captura 100% das transações em produção (ajustar se necessário para custos)
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

  // Profiling - captura detalhes de performance
  profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // ============================================================================
  // Session Replay - Gravação de sessões para debug
  // ============================================================================

  // 10% das sessões normais são gravadas
  replaysSessionSampleRate: 0.1,

  // 100% das sessões com erro são gravadas (IMPORTANTE para debug)
  replaysOnErrorSampleRate: 1.0,

  // ============================================================================
  // Integrações
  // ============================================================================
  integrations: [
    // Session Replay com proteção de dados sensíveis (LGPD)
    Sentry.replayIntegration({
      maskAllText: false, // Mostrar textos para debug
      maskAllInputs: true, // Mascarar inputs (senhas, dados pessoais)
      blockAllMedia: false,
      // Mascarar seletores específicos com dados sensíveis
      mask: [
        "[data-sentry-mask]",
        ".sensitive-data",
        "input[type='password']",
        "input[name='cpf']",
        "input[name='cnpj']",
        "input[name='email']",
      ],
    }),

    // Captura de erros HTTP
    Sentry.browserTracingIntegration({
      // Rastrear navegação entre páginas
      enableInp: true,
    }),
  ],

  // ============================================================================
  // Contexto e Filtros
  // ============================================================================

  // Ambiente
  environment: process.env.NODE_ENV,

  // Release (versão da aplicação)
  release: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",

  // Tags globais para filtrar no dashboard
  initialScope: {
    tags: {
      app: "crm-arrighi-frontend",
      platform: "web",
    },
  },

  // Ignorar erros comuns que não são úteis
  ignoreErrors: [
    // Erros de rede que são normais
    "Network request failed",
    "Failed to fetch",
    "Load failed",
    "NetworkError",
    // Erros de extensões do navegador
    "chrome-extension://",
    "moz-extension://",
    // Erros de scripts de terceiros
    "Script error.",
    // Erros de resize observer (comum em React)
    "ResizeObserver loop",
    // Erros de hydration que já foram logados
    "Hydration failed",
    "There was an error while hydrating",
  ],

  // Filtrar URLs de terceiros
  denyUrls: [
    /extensions\//i,
    /^chrome:\/\//i,
    /^moz-extension:\/\//i,
    /googleapis\.com/i,
    /gstatic\.com/i,
  ],

  // ============================================================================
  // Debug (apenas em desenvolvimento)
  // ============================================================================
  debug: process.env.NODE_ENV === "development",

  // ============================================================================
  // Hooks para enriquecer dados
  // ============================================================================
  beforeSend(event, hint) {
    // Adicionar informações extras ao evento
    const error = hint.originalException;

    // Se for erro de API, adicionar detalhes
    if (error && typeof error === "object" && "response" in error) {
      event.extra = {
        ...event.extra,
        apiResponse: (error as any).response?.data,
        apiStatus: (error as any).response?.status,
      };
    }

    // Em desenvolvimento, logar no console também
    if (process.env.NODE_ENV === "development") {
      console.error("🔴 Sentry capturou erro:", error);
    }

    return event;
  },

  // Hook para breadcrumbs (trilha de ações)
  beforeBreadcrumb(breadcrumb) {
    // Filtrar breadcrumbs muito verbosos
    if (breadcrumb.category === "console" && breadcrumb.level === "debug") {
      return null;
    }
    return breadcrumb;
  },
});




