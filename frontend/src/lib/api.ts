// src/lib/api.ts
import { getApiUrl, isDevelopment } from "../../env.config";
import logger from "./logger";

// O BFF autentica via cookie httpOnly; não há necessidade de ler token do localStorage.
const API_BASE_URL = getApiUrl();

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

class ApiClient {
  public baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    logger.log("🔧 ApiClient: Base URL configurada como:", this.baseUrl);
    logger.log("🔧 ApiClient: NODE_ENV =", process.env.NODE_ENV);

    // Verificação adicional para garantir que a URL está correta
    if (!this.baseUrl || this.baseUrl === "undefined") {
      logger.error("🔧 ApiClient: ERRO - Base URL está undefined ou vazia!");
      throw new Error("API Base URL não foi configurada corretamente");
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const config: RequestInit = {
        credentials: "include", // envia cookie httpOnly bff_session ao BFF
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...options.headers,
        },
        ...options,
      };

      if (isDevelopment()) {
        logger.log(`🌐 ${options.method || "GET"} ${url}`);
      }

      // Timeout desabilitado por solicitação
      let response: Response;
      try {
        response = await fetch(url, config);
      } catch (networkError) {
        logger.error("🔧 ApiClient: Network error on fetch:", networkError);
        return { error: "Failed to fetch", status: 0 };
      }

      // Debug logging apenas em desenvolvimento
      if (isDevelopment()) {
        logger.log("🔧 ApiClient: Response status:", response.status);
        logger.log("🔧 ApiClient: Response ok:", response.ok);
      }

      // Read response body once and store it
      let responseText = "";
      let data = null;

      try {
        responseText = await response.text();
      } catch (error) {
        logger.error("🔧 ApiClient: Erro ao ler resposta:", error);
        return {
          error: "Erro ao ler resposta do servidor",
          status: response.status,
        };
      }

      if (!response.ok) {
        // Se for erro de autenticação em endpoints de dados, tentar novamente sem autenticação
        if (response.status === 401 && this.isDataEndpoint(endpoint)) {
          logger.log(
            "🔄 Tentando requisição sem autenticação para endpoint de dados"
          );
          return this.requestWithoutAuth(endpoint, options);
        }

        // Se a resposta estiver vazia, retornar sem logar como erro (é comum em 401/403/404)
        if (!responseText || responseText.trim() === "") {
          if (isDevelopment() && response.status >= 500) {
            logger.error(
              `🔧 ApiClient: Erro ${response.status} com corpo vazio — ${url}`
            );
          }
          return {
            error: `Erro ${response.status}`,
            status: response.status,
          };
        }

        // Só loga como error para 5xx; 4xx são warn
        if (isDevelopment()) {
          const logFn = response.status >= 500 ? logger.error : logger.warn;
          logFn(`API ${response.status}: ${endpoint} — ${responseText}`);
        }

        return {
          error: responseText || `HTTP error! status: ${response.status}`,
          status: response.status,
        };
      }

      // Verificar se a resposta é JSON
      const contentType = response.headers.get("content-type");

      // Para status 204 (No Content), não esperamos JSON
      if (response.status === 204) {
        return {
          data: undefined,
          status: response.status,
        };
      }

      if (!contentType || !contentType.includes("application/json")) {
        logger.error(
          `Non-JSON response received: ${contentType}`,
          responseText
        );
        return {
          error: `Expected JSON response but got ${contentType}`,
          status: response.status,
        };
      }

      // Parse JSON from the stored response text
      try {
        data = JSON.parse(responseText);
      } catch (jsonError) {
        // Se não conseguir fazer parse do JSON, pode ser uma resposta vazia
        logger.error("🔧 ApiClient: Erro ao fazer parse do JSON:", jsonError);
        logger.error("🔧 ApiClient: Response text:", responseText);
        if (isDevelopment()) {
          logger.warn(`JSON parse error for ${endpoint}:`, jsonError);
        }
        data = null;
      }

      // Log apenas em desenvolvimento
      if (isDevelopment()) {
        logger.log(`✅ API Success: ${response.status} - ${endpoint}`);
        logger.log(
          `✅ Data type: ${
            Array.isArray(data) ? `Array[${data.length}]` : typeof data
          }`
        );
      }

      // Log adicional para debug em desenvolvimento
      if (isDevelopment()) {
        logger.log(`🔧 ApiClient: Resposta para ${endpoint}:`, {
          status: response.status,
          data: data,
          hasData: !!data,
          dataType: typeof data,
          isArray: Array.isArray(data),
        });
      }

      return {
        data,
        status: response.status,
      };
    } catch (error) {
      logger.error("🔧 ApiClient: Erro na requisição:", error);

      // Log de erro em desenvolvimento
      if (isDevelopment()) {
        logger.error(
          `Network Error: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );

        // Log específico para abort signals
        if (error instanceof Error && error.name === "AbortError") {
          logger.error(`Request was aborted: ${url}`);
        }
      }

      return {
        error: error instanceof Error ? error.message : "Network error",
        status: 0,
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async delete<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE", ...options });
  }

  // Verificar se é um endpoint de dados que pode funcionar sem autenticação
  private isDataEndpoint(endpoint: string): boolean {
    const dataEndpoints = [
      "/PessoaFisica",
      "/PessoaJuridica",
      "/Usuario",
      "/Cliente",
      "/Consultor",
      "/Filial",
      "/Contrato",
    ];
    return dataEndpoints.some((dataEndpoint) =>
      endpoint.startsWith(dataEndpoint)
    );
  }

  // Fazer requisição sem headers de autenticação
  private async requestWithoutAuth<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const config: RequestInit = {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Skip-Auth": "true", // Header para indicar ao backend que pule autenticação
          ...options.headers,
        },
        ...options,
      };

      logger.log("🔄 Fazendo requisição sem autenticação:", url);
      const response = await fetch(url, config);

      if (!response.ok) {
        return {
          error: `HTTP error! status: ${response.status}`,
          status: response.status,
        };
      }

      const responseText = await response.text();
      let data = null;

      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch (error) {
          logger.error("Erro ao fazer parse JSON:", error);
        }
      }

      return { data, status: response.status };
    } catch (error) {
      logger.error("Erro na requisição sem auth:", error);
      return { error: "Network error", status: 0 };
    }
  }

  // Método para streaming de respostas (SSE - Server-Sent Events)
  async stream(
    endpoint: string,
    data: any,
    onChunk: (chunk: string) => void,
    onComplete?: (fullResponse: string) => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        credentials: "include", // cookie httpOnly bff_session
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("ReadableStream not supported");
      }

      const decoder = new TextDecoder();
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          if (onComplete) {
            onComplete(fullResponse);
          }
          break;
        }

        const chunk = decoder.decode(value, { stream: true });

        // Parse SSE format (data: {...}\n\n)
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.slice(6);
            if (jsonStr === "[DONE]") {
              continue;
            }
            try {
              const parsed = JSON.parse(jsonStr);
              if (parsed.content) {
                fullResponse += parsed.content;
                onChunk(parsed.content);
              } else if (parsed.delta?.content) {
                fullResponse += parsed.delta.content;
                onChunk(parsed.delta.content);
              } else if (typeof parsed === "string") {
                fullResponse += parsed;
                onChunk(parsed);
              }
            } catch {
              // Se não for JSON, trata como texto puro
              if (jsonStr.trim()) {
                fullResponse += jsonStr;
                onChunk(jsonStr);
              }
            }
          } else if (line.trim() && !line.startsWith(":")) {
            // Texto puro (não SSE)
            fullResponse += line;
            onChunk(line);
          }
        }
      }
    } catch (error) {
      logger.error("Erro no streaming:", error);
      if (onError) {
        onError(error instanceof Error ? error : new Error("Streaming error"));
      }
    }
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
