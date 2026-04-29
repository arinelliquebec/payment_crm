import { RotaPermissao, ModuloType, AcaoType } from "@/types/permissions";
import { permissionService } from "./permission.service";
import { groupAccessService } from "./groupAccess.service";
import { TELAS, MODULO_PARA_TELA } from "@/types/groupAccess";

class NavigationService {
  private rotasCache: RotaPermissao[] | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
  private cacheTimestamp: number = 0;

  /**
   * Obtém todas as rotas disponíveis baseadas nas permissões do usuário e grupo de acesso
   */
  async getAvailableRoutes(): Promise<RotaPermissao[]> {
    // Verificar cache
    if (this.isCacheValid()) {
      return this.rotasCache!;
    }

    try {
      // Obter rotas baseadas em permissões
      const rotasPermissoes = await permissionService.getAvailableRoutes();

      // Obter telas acessíveis baseadas no grupo
      const telasAcessiveis = await groupAccessService.getAccessibleScreens();

      // Filtrar rotas baseadas no grupo de acesso
      const rotasFiltradas = rotasPermissoes.filter((rota) => {
        const telaCorrespondente = MODULO_PARA_TELA[rota.modulo];
        return telasAcessiveis.includes(telaCorrespondente);
      });

      this.rotasCache = rotasFiltradas;
      this.cacheTimestamp = Date.now();
      return rotasFiltradas;
    } catch (error) {
      console.error("Erro ao obter rotas disponíveis:", error);
      return [];
    }
  }

  /**
   * Verifica se o usuário pode acessar uma rota específica
   */
  async canAccessRoute(path: string): Promise<boolean> {
    const rotas = await this.getAvailableRoutes();
    return rotas.some((rota) => rota.path === path);
  }

  /**
   * Verifica se o usuário pode acessar uma tela baseada no grupo de acesso
   */
  async canAccessScreen(screenName: string): Promise<boolean> {
    try {
      return await groupAccessService.canAccessScreen(screenName);
    } catch (error) {
      console.error(`Erro ao verificar acesso à tela ${screenName}:`, error);
      return false;
    }
  }

  /**
   * Verifica se uma tela está oculta para o usuário
   */
  async isScreenHidden(screenName: string): Promise<boolean> {
    try {
      return await groupAccessService.isScreenHidden(screenName);
    } catch (error) {
      console.error(
        `Erro ao verificar se tela ${screenName} está oculta:`,
        error
      );
      return true; // Por segurança, considerar como oculta
    }
  }

  /**
   * Obtém rotas agrupadas por categoria
   */
  async getGroupedRoutes(): Promise<Record<string, RotaPermissao[]>> {
    const rotas = await this.getAvailableRoutes();

    const grupos: Record<string, RotaPermissao[]> = {
      Cadastros: [],
      Gestão: [],
      Financeiro: [],
      Administração: [],
    };

    rotas.forEach((rota) => {
      switch (rota.modulo) {
        case "PessoaFisica":
        case "PessoaJuridica":
        case "Cliente":
        case "Consultor":
        case "Parceiro":
          grupos["Cadastros"].push(rota);
          break;
        case "Contrato":
        case "Filial":
          grupos["Gestão"].push(rota);
          break;
        case "Boleto":
          grupos["Financeiro"].push(rota);
          break;
        case "Usuario":
        case "GrupoAcesso":
          grupos["Administração"].push(rota);
          break;
        default:
          grupos["Gestão"].push(rota);
      }
    });

    // Remover grupos vazios
    Object.keys(grupos).forEach((key) => {
      if (grupos[key].length === 0) {
        delete grupos[key];
      }
    });

    return grupos;
  }

  /**
   * Obtém rotas para o menu principal
   */
  async getMainMenuRoutes(): Promise<RotaPermissao[]> {
    const rotas = await this.getAvailableRoutes();

    // Ordenar rotas por prioridade
    const prioridade: Record<string, number> = {
      PessoaFisica: 1,
      PessoaJuridica: 2,
      Cliente: 3,
      Contrato: 4,
      Consultor: 5,
      Parceiro: 6,
      Boleto: 7,
      Filial: 8,
      Usuario: 9,
      GrupoAcesso: 10,
    };

    return rotas.sort((a, b) => {
      const prioridadeA = prioridade[a.modulo] || 999;
      const prioridadeB = prioridade[b.modulo] || 999;
      return prioridadeA - prioridadeB;
    });
  }

  /**
   * Obtém rotas para o menu mobile
   */
  async getMobileMenuRoutes(): Promise<RotaPermissao[]> {
    const rotas = await this.getAvailableRoutes();

    // Limitar a 6 rotas para o menu mobile
    return rotas.slice(0, 6);
  }

  /**
   * Obtém breadcrumb para uma rota específica
   */
  async getBreadcrumb(
    path: string
  ): Promise<Array<{ label: string; href?: string; icon?: string }>> {
    const rotas = await this.getAvailableRoutes();
    const rota = rotas.find((r) => r.path === path);

    if (!rota) {
      return [{ label: "Página não encontrada" }];
    }

    const breadcrumb = [
      { label: "Dashboard", href: "/", icon: "Home" },
      { label: rota.label, href: rota.path, icon: rota.icon },
    ];

    return breadcrumb;
  }

  /**
   * Obtém estatísticas de navegação
   */
  async getNavigationStats(): Promise<{
    totalRotas: number;
    rotasPorModulo: Record<string, number>;
    rotasPorAcao: Record<string, number>;
  }> {
    const rotas = await this.getAvailableRoutes();

    const rotasPorModulo: Record<string, number> = {};
    const rotasPorAcao: Record<string, number> = {};

    rotas.forEach((rota) => {
      rotasPorModulo[rota.modulo] = (rotasPorModulo[rota.modulo] || 0) + 1;
      rotasPorAcao[rota.acao] = (rotasPorAcao[rota.acao] || 0) + 1;
    });

    return {
      totalRotas: rotas.length,
      rotasPorModulo,
      rotasPorAcao,
    };
  }

  /**
   * Verifica se uma rota está ativa
   */
  isRouteActive(currentPath: string, routePath: string): boolean {
    return currentPath === routePath || currentPath.startsWith(routePath + "/");
  }

  /**
   * Obtém rotas relacionadas a um módulo
   */
  async getRelatedRoutes(modulo: ModuloType): Promise<RotaPermissao[]> {
    const rotas = await this.getAvailableRoutes();
    return rotas.filter((rota) => rota.modulo === modulo);
  }

  /**
   * Obtém rotas que requerem uma ação específica
   */
  async getRoutesByAction(acao: AcaoType): Promise<RotaPermissao[]> {
    const rotas = await this.getAvailableRoutes();
    return rotas.filter((rota) => rota.acao === acao);
  }

  /**
   * Invalida o cache de rotas
   */
  invalidateCache(): void {
    this.rotasCache = null;
    this.cacheTimestamp = 0;
    // Também invalidar cache do grupo de acesso
    groupAccessService.invalidateCache();
  }

  /**
   * Verifica se o cache é válido
   */
  private isCacheValid(): boolean {
    if (!this.rotasCache) {
      return false;
    }

    const now = Date.now();
    return now - this.cacheTimestamp < this.CACHE_DURATION;
  }

  /**
   * Obtém rotas para o dashboard
   */
  async getDashboardRoutes(): Promise<RotaPermissao[]> {
    const rotas = await this.getAvailableRoutes();

    // Rotas mais importantes para o dashboard
    const dashboardRotas = rotas.filter((rota) =>
      ["Cliente", "Contrato", "Consultor", "Boleto"].includes(rota.modulo)
    );

    return dashboardRotas.slice(0, 4); // Máximo 4 rotas no dashboard
  }

  /**
   * Obtém rotas para relatórios
   */
  async getReportRoutes(): Promise<RotaPermissao[]> {
    const rotas = await this.getAvailableRoutes();

    // Rotas que podem ter relatórios
    return rotas.filter((rota) =>
      [
        "Cliente",
        "Contrato",
        "Consultor",
        "Boleto",
        "PessoaFisica",
        "PessoaJuridica",
      ].includes(rota.modulo)
    );
  }

  /**
   * Obtém rotas para configurações
   */
  async getSettingsRoutes(): Promise<RotaPermissao[]> {
    const rotas = await this.getAvailableRoutes();

    // Rotas de configuração
    return rotas.filter((rota) =>
      ["Usuario", "GrupoAcesso", "Filial"].includes(rota.modulo)
    );
  }
}

// Instância singleton
export const navigationService = new NavigationService();
export default navigationService;
