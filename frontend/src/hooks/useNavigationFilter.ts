import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  navigationFilterService,
  MenuGroup,
} from "@/services/navigationFilter.service";

/**
 * Hook para filtrar navegação baseado no grupo do usuário
 */
export function useNavigationFilter() {
  const { permissoes } = useAuth();

  const filterMenuGroups = useMemo(() => {
    return (menuGroups: MenuGroup[]) => {
      return navigationFilterService.filterMenuGroups(menuGroups, permissoes);
    };
  }, [permissoes]);

  const canAccessRoute = useMemo(() => {
    return (route: string) => {
      return navigationFilterService.canAccessRoute(route, permissoes);
    };
  }, [permissoes]);

  const getAllowedRoutes = useMemo(() => {
    return navigationFilterService.getAllowedRoutes(permissoes);
  }, [permissoes]);

  const isUsuarioGroup = useMemo(() => {
    return permissoes?.grupo === "Usuario" || permissoes?.grupo === "Usuário";
  }, [permissoes]);

  return {
    filterMenuGroups,
    canAccessRoute,
    getAllowedRoutes,
    isUsuarioGroup,
    userGroup: permissoes?.grupo,
  };
}
