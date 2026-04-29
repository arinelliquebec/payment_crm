/**
 * Sentry Helper - CRM Arrighi
 *
 * Utilitários para captura de erros e eventos no Sentry.
 * Uso: import { captureError, captureMessage, setUserContext } from '@/lib/sentry';
 */

import * as Sentry from "@sentry/nextjs";

// ============================================================================
// Tipos
// ============================================================================

interface ErrorContext {
  feature?: string;
  action?: string;
  clienteId?: number | string;
  contratoId?: number | string;
  boletoId?: number | string;
  userId?: number | string;
  extra?: Record<string, unknown>;
}

interface UserContext {
  id: number | string;
  email?: string;
  nome?: string;
  filialId?: number;
  grupoAcesso?: string;
}

type SeverityLevel = "fatal" | "error" | "warning" | "info" | "debug";

// ============================================================================
// Captura de Erros
// ============================================================================

/**
 * Captura um erro e envia para o Sentry com contexto adicional.
 *
 * @example
 * try {
 *   await gerarBoleto(dados);
 * } catch (error) {
 *   captureError(error, {
 *     feature: 'boletos',
 *     action: 'gerar',
 *     clienteId: cliente.id,
 *   });
 * }
 */
export function captureError(
  error: unknown,
  context?: ErrorContext
): string | undefined {
  const scope = new Sentry.Scope();

  // Adicionar tags para filtrar no dashboard
  if (context?.feature) {
    scope.setTag("feature", context.feature);
  }
  if (context?.action) {
    scope.setTag("action", context.action);
  }
  if (context?.clienteId) {
    scope.setTag("clienteId", String(context.clienteId));
  }
  if (context?.contratoId) {
    scope.setTag("contratoId", String(context.contratoId));
  }
  if (context?.boletoId) {
    scope.setTag("boletoId", String(context.boletoId));
  }
  if (context?.userId) {
    scope.setTag("userId", String(context.userId));
  }

  // Adicionar dados extras
  if (context?.extra) {
    scope.setExtras(context.extra);
  }

  // Capturar o erro
  return Sentry.captureException(error, scope);
}

/**
 * Captura um erro de API com detalhes da resposta.
 *
 * @example
 * try {
 *   const response = await apiClient.post('/boleto', data);
 * } catch (error) {
 *   captureApiError(error, 'POST', '/boleto', data);
 * }
 */
export function captureApiError(
  error: unknown,
  method: string,
  endpoint: string,
  requestData?: unknown
): string | undefined {
  const scope = new Sentry.Scope();

  scope.setTag("type", "api_error");
  scope.setTag("http.method", method);
  scope.setTag("http.endpoint", endpoint);

  // Extrair informações da resposta de erro
  if (error && typeof error === "object") {
    const errorObj = error as Record<string, unknown>;

    if ("response" in errorObj) {
      const response = errorObj.response as Record<string, unknown>;
      scope.setExtra("response.status", response?.status);
      scope.setExtra("response.data", response?.data);
    }

    if ("message" in errorObj) {
      scope.setExtra("error.message", errorObj.message);
    }
  }

  scope.setExtra("request.data", requestData);

  return Sentry.captureException(error, scope);
}

// ============================================================================
// Mensagens e Eventos
// ============================================================================

/**
 * Captura uma mensagem/evento no Sentry.
 *
 * @example
 * captureMessage('Usuário tentou acessar recurso sem permissão', 'warning', {
 *   feature: 'permissions',
 *   userId: user.id,
 * });
 */
export function captureMessage(
  message: string,
  level: SeverityLevel = "info",
  context?: ErrorContext
): string | undefined {
  const scope = new Sentry.Scope();
  scope.setLevel(level);

  if (context?.feature) {
    scope.setTag("feature", context.feature);
  }
  if (context?.action) {
    scope.setTag("action", context.action);
  }
  if (context?.extra) {
    scope.setExtras(context.extra);
  }

  return Sentry.captureMessage(message, scope);
}

// ============================================================================
// Contexto do Usuário
// ============================================================================

/**
 * Define o contexto do usuário logado no Sentry.
 * Chamar após login bem-sucedido.
 *
 * @example
 * // No AuthContext após login
 * setUserContext({
 *   id: user.id,
 *   email: user.email,
 *   nome: user.nome,
 *   filialId: user.filialId,
 *   grupoAcesso: user.grupoAcesso?.nome,
 * });
 */
export function setUserContext(user: UserContext): void {
  Sentry.setUser({
    id: String(user.id),
    email: user.email,
    username: user.nome,
  });

  // Adicionar contexto extra como tags
  if (user.filialId) {
    Sentry.setTag("user.filialId", String(user.filialId));
  }
  if (user.grupoAcesso) {
    Sentry.setTag("user.grupoAcesso", user.grupoAcesso);
  }
}

/**
 * Limpa o contexto do usuário (chamar no logout).
 */
export function clearUserContext(): void {
  Sentry.setUser(null);
}

// ============================================================================
// Breadcrumbs (Trilha de Ações)
// ============================================================================

/**
 * Adiciona um breadcrumb (rastro de ação) para debug.
 *
 * @example
 * addBreadcrumb('navigation', 'Usuário acessou página de boletos');
 * addBreadcrumb('user', 'Usuário selecionou cliente', { clienteId: 123 });
 */
export function addBreadcrumb(
  category: "navigation" | "user" | "api" | "ui" | "transaction",
  message: string,
  data?: Record<string, unknown>,
  level: SeverityLevel = "info"
): void {
  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level,
    timestamp: Date.now() / 1000,
  });
}

// ============================================================================
// Transactions (Performance)
// ============================================================================

/**
 * Inicia uma transação para medir performance.
 *
 * @example
 * const transaction = startTransaction('gerar-boleto', 'boletos');
 * try {
 *   await gerarBoleto(dados);
 *   transaction.setStatus('ok');
 * } catch (error) {
 *   transaction.setStatus('error');
 * } finally {
 *   transaction.end();
 * }
 */
export function startTransaction(
  name: string,
  op: string
): Sentry.Span | undefined {
  return Sentry.startInactiveSpan({
    name,
    op,
    forceTransaction: true,
  });
}

// ============================================================================
// Helpers de Features Específicas
// ============================================================================

/**
 * Captura erro específico de boletos.
 */
export function captureBoletoError(
  error: unknown,
  action: "gerar" | "cancelar" | "consultar" | "baixar",
  boletoId?: number,
  clienteId?: number
): string | undefined {
  return captureError(error, {
    feature: "boletos",
    action,
    boletoId,
    clienteId,
    extra: {
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Captura erro específico de contratos.
 */
export function captureContratoError(
  error: unknown,
  action: "criar" | "editar" | "assinar" | "cancelar",
  contratoId?: number,
  clienteId?: number
): string | undefined {
  return captureError(error, {
    feature: "contratos",
    action,
    contratoId,
    clienteId,
  });
}

/**
 * Captura erro de integração bancária.
 */
export function captureBankingError(
  error: unknown,
  banco: "santander" | "inter" | "outro",
  operacao: string,
  detalhes?: Record<string, unknown>
): string | undefined {
  return captureError(error, {
    feature: "banking",
    action: operacao,
    extra: {
      banco,
      ...detalhes,
    },
  });
}

// ============================================================================
// Export Sentry para uso avançado
// ============================================================================

export { Sentry };

