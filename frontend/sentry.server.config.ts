import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // ============================================================================
  // Performance Monitoring (Server-side)
  // ============================================================================

  // Taxa de amostragem para transações
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

  // Profiling
  profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // ============================================================================
  // Contexto
  // ============================================================================

  environment: process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",

  // Tags globais
  initialScope: {
    tags: {
      app: "crm-arrighi-frontend",
      runtime: "nodejs",
      component: "server",
    },
  },

  // ============================================================================
  // Filtros
  // ============================================================================

  ignoreErrors: [
    // Erros de conexão com backend
    "ECONNREFUSED",
    "ECONNRESET",
    "ETIMEDOUT",
    // Erros de timeout normais
    "Timeout",
    "AbortError",
  ],

  // ============================================================================
  // Hooks
  // ============================================================================

  beforeSend(event, hint) {
    const error = hint.originalException;

    // Adicionar contexto de API routes
    if (error && typeof error === "object") {
      event.extra = {
        ...event.extra,
        errorName: (error as Error).name,
        errorStack: (error as Error).stack,
      };
    }

    return event;
  },

  // ============================================================================
  // Debug
  // ============================================================================
  debug: process.env.NODE_ENV === "development",
});




