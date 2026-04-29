import { getApiUrl, isDevelopment } from "../../../env.config";

const API_BASE_URL = getApiUrl();

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

export interface ApiError {
  message: string;
  code: string;
  statusCode: number;
}

class ApiClient {
  public baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;

    if (isDevelopment()) {
      console.log("🔧 ApiClient: Base URL configurada como:", this.baseUrl);
    }

    if (!this.baseUrl || this.baseUrl === "undefined") {
      throw new Error("API Base URL não foi configurada corretamente");
    }
  }

  private getAuthHeaders(): Record<string, string> {
    if (typeof window === "undefined") return {};

    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    const headers: Record<string, string> = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    if (user) {
      try {
        const userData = JSON.parse(user);
        const usuarioId =
          userData.UsuarioId ||
          userData.usuarioId ||
          userData.id ||
          userData.Id ||
          userData.userId;

        if (usuarioId) {
          headers["X-Usuario-Id"] = usuarioId.toString();
        }
      } catch (e) {
        console.warn("Erro ao fazer parse do usuário:", e);
      }
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const startTime = performance.now();

    try {
      const config: RequestInit = {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...this.getAuthHeaders(),
          ...options.headers,
        },
        ...options,
      };

      if (isDevelopment()) {
        console.log(`🌐 ${options.method || "GET"} ${url}`);
      }

      const response = await fetch(url, config);

      // Log performance
      const duration = performance.now() - startTime;
      if (isDevelopment()) {
        console.log(
          `⏱️ ${options.method || "GET"} ${endpoint}: ${duration.toFixed(2)}ms`
        );
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return {
          data: undefined,
          status: response.status,
        };
      }

      const responseText = await response.text();
      let data = null;

      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch (error) {
          if (!response.ok) {
            return {
              error: responseText || `HTTP error! status: ${response.status}`,
              status: response.status,
            };
          }
        }
      }

      if (!response.ok) {
        return {
          error:
            data?.message ||
            responseText ||
            `HTTP error! status: ${response.status}`,
          status: response.status,
        };
      }

      if (isDevelopment()) {
        console.log(`✅ ${response.status} - ${endpoint}`);
      }

      return {
        data,
        status: response.status,
      };
    } catch (error) {
      console.error("🔧 ApiClient: Erro na requisição:", error);
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

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

// Re-export for backward compatibility
export { apiClient as default };
