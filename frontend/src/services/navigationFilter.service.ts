import { UsuarioPermissoes } from "@/types/permissions";

export interface MenuItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  requiredModule?: string;
  requiredAction?: string;
  external?: boolean;
}

export interface MenuGroup {
  label: string;
  items: MenuItem[];
  requiredGroup?: string[];
  hiddenForGroups?: string[];
}

class NavigationFilterService {
  /**
   * Filtra os grupos de menu baseado no grupo do usuário
   */
  filterMenuGroups(
    menuGroups: MenuGroup[],
    userPermissions: UsuarioPermissoes | null
  ): MenuGroup[] {
    if (!userPermissions) {
      return [];
    }

    // Se o grupo é "Usuario", só mostrar o dashboard
    if (
      userPermissions.grupo === "Usuario" ||
      userPermissions.grupo === "Usuário"
    ) {
      return []; // Nenhum menu além do dashboard
    }

    // Se o grupo é "Consultores", filtrar apenas módulos permitidos
    if (userPermissions.grupo === "Consultores") {
      return menuGroups
        .map((group) => {
          // Para Consultores, mostrar "Cadastros" e "Gestão" com itens específicos
          if (group.label === "Cadastros") {
            return {
              ...group,
              items: group.items.filter((item) => {
                // Permitir apenas Pessoa Física, Pessoa Jurídica e Clientes
                return (
                  item.href.includes("/pessoa-fisica") ||
                  item.href.includes("/pessoa-juridica") ||
                  item.href.includes("/clientes")
                );
              }),
            };
          }
          if (group.label === "Gestão") {
            return {
              ...group,
              items: group.items.filter((item) => {
                // Permitir apenas Contratos
                return item.href.includes("/contratos");
              }),
            };
          }
          return null;
        })
        .filter(
          (group) => group !== null && group.items.length > 0
        ) as MenuGroup[];
    }

    // Se o grupo é "Administrativo de Filial", apenas visualização
    if (userPermissions.grupo === "Administrativo de Filial") {
      return menuGroups
        .map((group) => {
          // Para Administrativo de Filial, mostrar apenas "Cadastros" e "Gestão" específicos
          if (group.label === "Cadastros") {
            return {
              ...group,
              items: group.items.filter((item) => {
                // Permitir apenas Consultores e Clientes
                return (
                  item.href.includes("/consultores") ||
                  item.href.includes("/clientes")
                );
              }),
            };
          }
          if (group.label === "Gestão") {
            return {
              ...group,
              items: group.items.filter((item) => {
                // Permitir apenas Contratos
                return item.href.includes("/contratos");
              }),
            };
          }
          return null;
        })
        .filter(
          (group) => group !== null && group.items.length > 0
        ) as MenuGroup[];
    }

    // Se o grupo é "Gestor de Filial", acesso total exceto Usuários
    if (userPermissions.grupo === "Gestor de Filial") {
      return menuGroups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => {
            // Bloquear apenas a página de Usuários
            return !item.href.includes("/usuarios");
          }),
        }))
        .filter((group) => group.items.length > 0);
    }

    // Se o grupo é "Faturamento", acesso total exceto Usuários (similar ao Administrador)
    if (userPermissions.grupo === "Faturamento") {
      return menuGroups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => {
            // Bloquear apenas a página de Usuários
            return !item.href.includes("/usuarios");
          }),
        }))
        .filter((group) => group.items.length > 0);
    }

    // Se o grupo é "Cobrança e Financeiro", visualização de tudo exceto Usuários
    if (
      userPermissions.grupo === "Cobrança e Financeiro" ||
      userPermissions.grupo === "Cobrança/Financeiro"
    ) {
      return menuGroups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => {
            // Bloquear apenas a página de Usuários
            return !item.href.includes("/usuarios");
          }),
        }))
        .filter((group) => group.items.length > 0);
    }

    return menuGroups
      .map((group) => ({
        ...group,
        items: this.filterMenuItems(group.items, userPermissions),
      }))
      .filter((group) => {
        // Remover grupos vazios
        if (group.items.length === 0) return false;

        // Verificar se o grupo é permitido
        if (
          group.requiredGroup &&
          !group.requiredGroup.includes(userPermissions.grupo)
        ) {
          return false;
        }

        // Verificar se o grupo é proibido
        if (
          group.hiddenForGroups &&
          group.hiddenForGroups.includes(userPermissions.grupo)
        ) {
          return false;
        }

        return true;
      });
  }

  /**
   * Filtra os itens de menu baseado nas permissões do usuário
   */
  private filterMenuItems(
    items: MenuItem[],
    userPermissions: UsuarioPermissoes
  ): MenuItem[] {
    return items.filter((item) => {
      // Se não tem módulo/ação definida, permitir por padrão
      if (!item.requiredModule || !item.requiredAction) {
        return true;
      }

      // Verificar se o usuário tem a permissão necessária
      const requiredPermission = `${item.requiredModule}_${item.requiredAction}`;
      return userPermissions.permissoes.includes(requiredPermission);
    });
  }

  /**
   * Verifica se o usuário pode acessar uma rota específica
   */
  canAccessRoute(
    route: string,
    userPermissions: UsuarioPermissoes | null
  ): boolean {
    if (!userPermissions) {
      return false;
    }

    // Se o grupo é "Usuario", só permitir dashboard
    if (
      userPermissions.grupo === "Usuario" ||
      userPermissions.grupo === "Usuário"
    ) {
      return (
        route === "/" ||
        route === "/dashboard" ||
        route.startsWith("/dashboard")
      );
    }

    // Helper function para verificar se a rota corresponde
    const matchesRoute = (allowedRoute: string) => {
      return route === allowedRoute || route.startsWith(allowedRoute + "/");
    };

    // Se o grupo é "Consultores", permitir apenas rotas específicas
    if (userPermissions.grupo === "Consultores") {
      const consultorRoutes = [
        "/",
        "/dashboard",
        "/cadastros/pessoa-fisica",
        "/cadastros/pessoa-juridica",
        "/clientes",
        "/contratos",
      ];
      return consultorRoutes.some(matchesRoute);
    }

    // Se o grupo é "Administrativo de Filial", apenas visualização de módulos específicos
    if (userPermissions.grupo === "Administrativo de Filial") {
      const administrativoRoutes = [
        "/",
        "/dashboard",
        "/consultores",
        "/clientes",
        "/contratos",
      ];
      return administrativoRoutes.some(matchesRoute);
    }

    // Se o grupo é "Gestor de Filial", acesso total exceto usuários
    if (userPermissions.grupo === "Gestor de Filial") {
      // Bloquear apenas a rota de usuários
      if (route.startsWith("/usuarios")) {
        return false;
      }
      // Permitir todas as outras rotas (será filtrado por filial no backend)
      return true;
    }

    // Se o grupo é "Faturamento", acesso total exceto usuários (todas as filiais)
    if (userPermissions.grupo === "Faturamento") {
      // Bloquear apenas a rota de usuários
      if (route.startsWith("/usuarios")) {
        return false;
      }
      // Permitir todas as outras rotas (acesso global, todas as filiais)
      return true;
    }

    // Se o grupo é "Cobrança e Financeiro", visualização de tudo exceto usuários
    if (
      userPermissions.grupo === "Cobrança e Financeiro" ||
      userPermissions.grupo === "Cobrança/Financeiro"
    ) {
      // Bloquear apenas a rota de usuários
      if (route.startsWith("/usuarios")) {
        return false;
      }
      // Permitir todas as outras rotas (apenas visualização, todas as filiais)
      return true;
    }

    // Para outros grupos, verificar permissões específicas
    const routePermissions: Record<string, string> = {
      "/cadastros/pessoa-fisica": "PessoaFisica_Visualizar",
      "/cadastros/pessoa-juridica": "PessoaJuridica_Visualizar",
      "/clientes": "Cliente_Visualizar",
      "/contratos": "Contrato_Visualizar",
      "/consultores": "Consultor_Visualizar",
      "/usuarios": "Usuario_Visualizar",
      "/parceiros": "Parceiro_Visualizar",
      "/boletos": "Boleto_Visualizar",
      "/dashboard/financeiro": "Boleto_Visualizar",
      "/gestao": "Cliente_Visualizar", // Gestão geralmente precisa de Cliente_Visualizar
    };

    // Verificar se a rota corresponde a alguma rota base
    for (const [baseRoute, permission] of Object.entries(routePermissions)) {
      if (matchesRoute(baseRoute)) {
        return userPermissions.permissoes.includes(permission);
      }
    }

      // Se não está mapeado, permitir (ex: dashboard principal)
      return true;
  }

  /**
   * Obtém as rotas permitidas para o usuário
   */
  getAllowedRoutes(userPermissions: UsuarioPermissoes | null): string[] {
    if (!userPermissions) {
      return ["/login"];
    }

    // Se o grupo é "Usuario", só permitir dashboard
    if (
      userPermissions.grupo === "Usuario" ||
      userPermissions.grupo === "Usuário"
    ) {
      return ["/", "/dashboard", "/dashboard/financeiro"];
    }

    // Se o grupo é "Consultores", permitir apenas rotas específicas
    if (userPermissions.grupo === "Consultores") {
      return [
        "/",
        "/dashboard",
        "/cadastros/pessoa-fisica",
        "/cadastros/pessoa-juridica",
        "/clientes",
        "/contratos",
      ];
    }

    // Se o grupo é "Administrativo de Filial", apenas rotas de visualização
    if (userPermissions.grupo === "Administrativo de Filial") {
      return ["/", "/dashboard", "/consultores", "/clientes", "/contratos"];
    }

    // Se o grupo é "Gestor de Filial", todas as rotas exceto usuários
    if (userPermissions.grupo === "Gestor de Filial") {
      const allRoutes = [
        "/",
        "/dashboard",
        "/dashboard/financeiro",
        "/cadastros/pessoa-fisica",
        "/cadastros/pessoa-juridica",
        "/clientes",
        "/contratos",
        "/consultores",
        "/parceiros",
        "/boletos",
      ];
      return allRoutes;
    }

    // Se o grupo é "Faturamento", todas as rotas exceto usuários (acesso global)
    if (userPermissions.grupo === "Faturamento") {
      const allRoutes = [
        "/",
        "/dashboard",
        "/dashboard/financeiro",
        "/cadastros/pessoa-fisica",
        "/cadastros/pessoa-juridica",
        "/clientes",
        "/contratos",
        "/consultores",
        "/parceiros",
        "/boletos",
      ];
      return allRoutes;
    }

    // Se o grupo é "Cobrança e Financeiro", todas as rotas exceto usuários (apenas visualização)
    if (
      userPermissions.grupo === "Cobrança e Financeiro" ||
      userPermissions.grupo === "Cobrança/Financeiro"
    ) {
      const allRoutes = [
        "/",
        "/dashboard",
        "/dashboard/financeiro",
        "/cadastros/pessoa-fisica",
        "/cadastros/pessoa-juridica",
        "/clientes",
        "/contratos",
        "/consultores",
        "/parceiros",
        "/boletos",
      ];
      return allRoutes;
    }

    const allRoutes = [
      "/",
      "/dashboard",
      "/dashboard/financeiro",
      "/cadastros/pessoa-fisica",
      "/cadastros/pessoa-juridica",
      "/clientes",
      "/contratos",
      "/consultores",
      "/usuarios",
      "/parceiros",
      "/boletos",
    ];

    return allRoutes.filter((route) =>
      this.canAccessRoute(route, userPermissions)
    );
  }
}

export const navigationFilterService = new NavigationFilterService();
