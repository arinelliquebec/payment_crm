import { apiClient } from "@/lib/api";
import { GroupAccessInfo } from "@/types/groupAccess";

/**
 * Serviço para gerenciar grupos de acesso
 */
class GroupAccessService {
  private cache: {
    groupInfo?: GroupAccessInfo;
    lastFetch?: number;
    accessibleModules?: string[];
    accessibleScreens?: string[];
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
   * Obtém informações completas sobre o acesso do usuário
   */
  async getGroupAccessInfo(): Promise<GroupAccessInfo> {
    if (this.isCacheValid() && this.cache.groupInfo) {
      return this.cache.groupInfo;
    }

    try {
      const response = await apiClient.get<GroupAccessInfo>(
        "/GroupAccess/user-info"
      );

      if (response.data) {
        this.cache.groupInfo = response.data;
        this.cache.lastFetch = Date.now();
        return response.data;
      }

      throw new Error("Dados de grupo não encontrados");
    } catch (error) {
      console.error("Erro ao obter informações do grupo:", error);
      // Retornar informações padrão para usuário sem grupo
      return {
        grupoId: 1,
        grupoNome: "Usuario",
        descricao: "Usuário sem grupo de acesso",
        modulosPermitidos: [],
        modulosOcultos: [],
        telasPermitidas: [],
        telasOcultas: [],
        apenasFilial: false,
        apenasLeitura: true,
        ocultarAbaUsuarios: true,
      };
    }
  }

  /**
   * Verifica se o usuário pode acessar um módulo específico
   */
  async canAccessModule(modulo: string): Promise<boolean> {
    try {
      const response = await apiClient.get<boolean>(
        `/GroupAccess/can-access-module/${modulo}`
      );
      return response.data ?? false;
    } catch (error) {
      console.error(`Erro ao verificar acesso ao módulo ${modulo}:`, error);
      return false;
    }
  }

  /**
   * Verifica se o usuário pode acessar uma tela específica
   */
  async canAccessScreen(screenName: string): Promise<boolean> {
    try {
      const response = await apiClient.get<boolean>(
        `/GroupAccess/can-access-screen/${screenName}`
      );
      return response.data ?? false;
    } catch (error) {
      console.error(`Erro ao verificar acesso à tela ${screenName}:`, error);
      return false;
    }
  }

  /**
   * Obtém lista de módulos que o usuário pode acessar
   */
  async getAccessibleModules(): Promise<string[]> {
    if (this.isCacheValid() && this.cache.accessibleModules) {
      return this.cache.accessibleModules;
    }

    try {
      const response = await apiClient.get<string[]>(
        "/GroupAccess/accessible-modules"
      );

      if (response.data) {
        this.cache.accessibleModules = response.data;
        this.cache.lastFetch = Date.now();
        return response.data;
      }

      return [];
    } catch (error) {
      console.error("Erro ao obter módulos acessíveis:", error);
      return [];
    }
  }

  /**
   * Obtém lista de telas que o usuário pode acessar
   */
  async getAccessibleScreens(): Promise<string[]> {
    if (this.isCacheValid() && this.cache.accessibleScreens) {
      return this.cache.accessibleScreens;
    }

    try {
      const response = await apiClient.get<string[]>(
        "/GroupAccess/accessible-screens"
      );

      if (response.data) {
        this.cache.accessibleScreens = response.data;
        this.cache.lastFetch = Date.now();
        return response.data;
      }

      return [];
    } catch (error) {
      console.error("Erro ao obter telas acessíveis:", error);
      return [];
    }
  }

  /**
   * Verifica se um módulo está oculto para o usuário
   */
  async isModuleHidden(modulo: string): Promise<boolean> {
    try {
      const response = await apiClient.get<boolean>(
        `/GroupAccess/is-module-hidden/${modulo}`
      );
      return response.data ?? false;
    } catch (error) {
      console.error(
        `Erro ao verificar se módulo ${modulo} está oculto:`,
        error
      );
      return true; // Por segurança, considerar como oculto em caso de erro
    }
  }

  /**
   * Verifica se uma tela está oculta para o usuário
   */
  async isScreenHidden(screenName: string): Promise<boolean> {
    const groupInfo = await this.getGroupAccessInfo();
    return groupInfo.telasOcultas.includes(screenName);
  }

  /**
   * Verifica se o usuário tem acesso apenas à sua filial
   */
  async isFilialOnly(): Promise<boolean> {
    const groupInfo = await this.getGroupAccessInfo();
    return groupInfo.apenasFilial;
  }

  /**
   * Verifica se o usuário tem apenas permissões de leitura
   */
  async isReadOnly(): Promise<boolean> {
    const groupInfo = await this.getGroupAccessInfo();
    return groupInfo.apenasLeitura;
  }

  /**
   * Verifica se a aba de usuários deve ser ocultada
   */
  async shouldHideUsersTab(): Promise<boolean> {
    const groupInfo = await this.getGroupAccessInfo();
    return groupInfo.ocultarAbaUsuarios;
  }

  /**
   * Obtém o nome do grupo do usuário
   */
  async getGroupName(): Promise<string> {
    const groupInfo = await this.getGroupAccessInfo();
    return groupInfo.grupoNome;
  }

  /**
   * Obtém a descrição do grupo do usuário
   */
  async getGroupDescription(): Promise<string> {
    const groupInfo = await this.getGroupAccessInfo();
    return groupInfo.descricao;
  }

  /**
   * Invalida o cache (útil após mudanças de permissões)
   */
  invalidateCache(): void {
    this.clearCache();
  }

  /**
   * Verifica se o usuário é administrador
   */
  async isAdmin(): Promise<boolean> {
    const groupName = await this.getGroupName();
    return groupName === "Administrador";
  }

  /**
   * Verifica se o usuário é consultor
   */
  async isConsultor(): Promise<boolean> {
    const groupName = await this.getGroupName();
    return groupName === "Consultores";
  }

  /**
   * Verifica se o usuário é gestor de filial
   */
  async isGestorFilial(): Promise<boolean> {
    const groupName = await this.getGroupName();
    return groupName === "Gestor de Filial";
  }

  /**
   * Verifica se o usuário é administrativo de filial
   */
  async isAdministrativoFilial(): Promise<boolean> {
    const groupName = await this.getGroupName();
    return groupName === "Administrativo de Filial";
  }

  /**
   * Verifica se o usuário é do financeiro
   */
  async isFinanceiro(): Promise<boolean> {
    const groupName = await this.getGroupName();
    return groupName === "Cobrança e Financeiro";
  }

  /**
   * Verifica se o usuário é do faturamento
   */
  async isFaturamento(): Promise<boolean> {
    const groupName = await this.getGroupName();
    return groupName === "Faturamento";
  }

  /**
   * Verifica se o usuário tem grupo válido (não é apenas "Usuario")
   */
  async hasValidGroup(): Promise<boolean> {
    const groupName = await this.getGroupName();
    return groupName !== "Usuario";
  }
}

// Instância singleton do serviço
export const groupAccessService = new GroupAccessService();
