import DOMPurify from "isomorphic-dompurify";

/**
 * Configurações de sanitização para diferentes contextos
 */
const SANITIZE_CONFIGS = {
  // Texto simples - remove todas as tags HTML
  text: {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  },
  // HTML básico - permite apenas formatação básica
  basicHtml: {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "u", "br", "p"],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  },
  // HTML rico - permite mais tags para conteúdo editorial
  richHtml: {
    ALLOWED_TAGS: [
      "b",
      "i",
      "em",
      "strong",
      "u",
      "br",
      "p",
      "ul",
      "ol",
      "li",
      "a",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
    ],
    ALLOWED_ATTR: ["href", "target", "rel"],
    KEEP_CONTENT: true,
  },
};

/**
 * Sanitiza uma string removendo conteúdo potencialmente perigoso
 * @param input - String a ser sanitizada
 * @param type - Tipo de sanitização ('text', 'basicHtml', 'richHtml')
 * @returns String sanitizada
 */
export function sanitizeInput(
  input: string | undefined | null,
  type: "text" | "basicHtml" | "richHtml" = "text"
): string {
  if (!input) return "";

  const config = SANITIZE_CONFIGS[type];
  return DOMPurify.sanitize(input, config);
}

/**
 * Sanitiza um objeto recursivamente
 * @param obj - Objeto a ser sanitizado
 * @param type - Tipo de sanitização
 * @returns Objeto sanitizado
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  type: "text" | "basicHtml" | "richHtml" = "text"
): T {
  const sanitized: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeInput(value, type);
    } else if (typeof value === "object" && value !== null) {
      if (Array.isArray(value)) {
        sanitized[key] = value.map((item) =>
          typeof item === "string"
            ? sanitizeInput(item, type)
            : typeof item === "object"
            ? sanitizeObject(item, type)
            : item
        );
      } else {
        sanitized[key] = sanitizeObject(value, type);
      }
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

/**
 * Remove caracteres especiais perigosos de nomes de arquivos
 * @param filename - Nome do arquivo
 * @returns Nome do arquivo sanitizado
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return "";

  // Remove path traversal attempts
  let sanitized = filename.replace(/\.\./g, "");

  // Remove caracteres especiais perigosos
  sanitized = sanitized.replace(/[<>:"|?*\x00-\x1f]/g, "");

  // Remove espaços no início e fim
  sanitized = sanitized.trim();

  // Limita o tamanho do nome do arquivo
  const maxLength = 255;
  if (sanitized.length > maxLength) {
    const ext = sanitized.split(".").pop() || "";
    const nameWithoutExt = sanitized.substring(
      0,
      sanitized.length - ext.length - 1
    );
    sanitized = nameWithoutExt.substring(0, maxLength - ext.length - 1) + "." + ext;
  }

  return sanitized;
}

/**
 * Sanitiza URL removendo protocolos perigosos
 * @param url - URL a ser sanitizada
 * @returns URL sanitizada ou string vazia se inválida
 */
export function sanitizeUrl(url: string): string {
  if (!url) return "";

  const sanitized = DOMPurify.sanitize(url, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });

  // Permitir apenas protocolos seguros
  const allowedProtocols = ["http:", "https:", "mailto:", "tel:"];
  try {
    const urlObj = new URL(sanitized);
    if (!allowedProtocols.includes(urlObj.protocol)) {
      return "";
    }
    return sanitized;
  } catch {
    // Se não for uma URL válida, retornar vazio
    return "";
  }
}

/**
 * Remove espaços em branco extras e normaliza quebras de linha
 * @param text - Texto a ser normalizado
 * @returns Texto normalizado
 */
export function normalizeWhitespace(text: string): string {
  if (!text) return "";

  return text
    .replace(/\r\n/g, "\n") // Normalizar quebras de linha
    .replace(/\r/g, "\n") // Normalizar quebras de linha
    .replace(/\t/g, " ") // Substituir tabs por espaços
    .replace(/ +/g, " ") // Remover espaços múltiplos
    .replace(/\n{3,}/g, "\n\n") // Limitar quebras de linha consecutivas
    .trim();
}

/**
 * Escapa caracteres especiais para uso em SQL LIKE
 * @param text - Texto a ser escapado
 * @returns Texto escapado
 */
export function escapeSqlLike(text: string): string {
  if (!text) return "";

  return text
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");
}

/**
 * Remove caracteres não numéricos de uma string
 * @param text - Texto a ser limpo
 * @returns Apenas números
 */
export function extractNumbers(text: string): string {
  if (!text) return "";
  return text.replace(/\D/g, "");
}

/**
 * Formata CPF removendo caracteres não numéricos
 * @param cpf - CPF a ser formatado
 * @returns CPF apenas com números
 */
export function sanitizeCPF(cpf: string): string {
  return extractNumbers(cpf);
}

/**
 * Formata CNPJ removendo caracteres não numéricos
 * @param cnpj - CNPJ a ser formatado
 * @returns CNPJ apenas com números
 */
export function sanitizeCNPJ(cnpj: string): string {
  return extractNumbers(cnpj);
}

/**
 * Sanitiza telefone removendo caracteres não numéricos
 * @param phone - Telefone a ser sanitizado
 * @returns Telefone apenas com números
 */
export function sanitizePhone(phone: string): string {
  return extractNumbers(phone);
}

/**
 * Valida e sanitiza email
 * @param email - Email a ser sanitizado
 * @returns Email sanitizado ou string vazia se inválido
 */
export function sanitizeEmail(email: string): string {
  if (!email) return "";

  const sanitized = sanitizeInput(email, "text").toLowerCase().trim();

  // Validação básica de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    return "";
  }

  return sanitized;
}
