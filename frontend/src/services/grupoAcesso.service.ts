import { apiClient } from "@/lib/api";

export interface GrupoAcesso {
  id: number;
  nome: string;
  descricao?: string;
  ativo: boolean;
  dataCadastro: string;
  dataAtualizacao?: string;
}

export interface GrupoAcessoOption {
  value: string;
  label: string;
  id: number;
}

/**
 * Serviço para gerenciar grupos de acesso
 */
class GrupoAcessoService {
  private cache: {
    grupos?: GrupoAcesso[];
    options?: GrupoAcessoOption[];
    lastFetch?: number;
  } = {};

  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  /**
   * Verifica se o cache está válido
   */
  private isCacheValid(): boolean {
    if (!this.cache.lastFetch) return false;
    return Date.now() - this.cache.lastFetch < this.CACHE_DURATION;
  }

  /**
   * Limpa o cache
   */
  private clearCache(): void {
    this.cache = {};
  }

  /**
   * Obtém todos os grupos de acesso
   */
  async getGruposAcesso(): Promise<GrupoAcesso[]> {
    if (this.isCacheValid() && this.cache.grupos) {
      return this.cache.grupos;
    }

    try {
      const response = await apiClient.get<GrupoAcesso[]>("/GrupoAcesso");

      if (response.data) {
        this.cache.grupos = response.data;
        this.cache.lastFetch = Date.now();
        return response.data;
      }

      return [];
    } catch (error) {
      console.error("Erro ao obter grupos de acesso:", error);
      return [];
    }
  }

  /**
   * Obtém grupos de acesso como opções para select
   */
  async getGruposAcessoOptions(): Promise<GrupoAcessoOption[]> {
    if (this.isCacheValid() && this.cache.options) {
      return this.cache.options;
    }

    try {
      const grupos = await this.getGruposAcesso();
      const options = grupos.map((grupo) => ({
        value: grupo.nome,
        label: grupo.nome,
        id: grupo.id,
      }));

      this.cache.options = options;
      return options;
    } catch (error) {
      console.error("Erro ao obter opções de grupos de acesso:", error);
      return [];
    }
  }

  /**
   * Obtém um grupo de acesso por ID
   */
  async getGrupoAcessoById(id: number): Promise<GrupoAcesso | null> {
    try {
      const response = await apiClient.get<GrupoAcesso>(`/GrupoAcesso/${id}`);
      return response.data || null;
    } catch (error) {
      console.error(`Erro ao obter grupo de acesso ${id}:`, error);
      return null;
    }
  }

  /**
   * Obtém um grupo de acesso por nome
   */
  async getGrupoAcessoByNome(nome: string): Promise<GrupoAcesso | null> {
    try {
      const grupos = await this.getGruposAcesso();
      return grupos.find((grupo) => grupo.nome === nome) || null;
    } catch (error) {
      console.error(`Erro ao obter grupo de acesso por nome ${nome}:`, error);
      return null;
    }
  }

  /**
   * Invalida o cache
   */
  invalidateCache(): void {
    this.clearCache();
  }

  /**
   * Obtém opções padrão caso não consiga buscar do backend
   */
  getDefaultOptions(): GrupoAcessoOption[] {
    return [
      { value: "Usuario", label: "Usuário", id: 1 },
      { value: "Administrador", label: "Administrador", id: 2 },
      { value: "Consultores", label: "Consultores", id: 3 },
      {
        value: "Administrativo de Filial",
        label: "Administrativo de Filial",
        id: 4,
      },
      { value: "Gestor de Filial", label: "Gestor de Filial", id: 5 },
      { value: "Cobrança e Financeiro", label: "Cobrança e Financeiro", id: 6 },
      { value: "Faturamento", label: "Faturamento", id: 7 },
    ];
  }
}

// Instância singleton
export const grupoAcessoService = new GrupoAcessoService();
