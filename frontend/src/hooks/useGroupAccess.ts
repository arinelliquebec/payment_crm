import { useState, useEffect, useCallback } from "react";
import { groupAccessService } from "@/services/groupAccess.service";
import { GroupAccessInfo } from "@/types/groupAccess";

/**
 * Hook para obter informações completas do grupo de acesso
 */
export function useGroupAccess() {
  const [groupInfo, setGroupInfo] = useState<GroupAccessInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroupInfo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const info = await groupAccessService.getGroupAccessInfo();
      setGroupInfo(info);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao carregar informações do grupo"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroupInfo();
  }, [fetchGroupInfo]);

  const refresh = useCallback(() => {
    groupAccessService.invalidateCache();
    fetchGroupInfo();
  }, [fetchGroupInfo]);

  return {
    groupInfo,
    loading,
    error,
    refresh,
  };
}

/**
 * Hook para verificar se o usuário pode acessar um módulo
 */
export function useCanAccessModule(modulo: string) {
  const [canAccess, setCanAccess] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        setLoading(true);
        const access = await groupAccessService.canAccessModule(modulo);
        setCanAccess(access);
      } catch (error) {
        console.error(`Erro ao verificar acesso ao módulo ${modulo}:`, error);
        setCanAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [modulo]);

  return { canAccess, loading };
}

/**
 * Hook para verificar se o usuário pode acessar uma tela
 */
export function useCanAccessScreen(screenName: string) {
  const [canAccess, setCanAccess] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        setLoading(true);
        const access = await groupAccessService.canAccessScreen(screenName);
        setCanAccess(access);
      } catch (error) {
        console.error(`Erro ao verificar acesso à tela ${screenName}:`, error);
        setCanAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [screenName]);

  return { canAccess, loading };
}

/**
 * Hook para obter módulos acessíveis
 */
export function useAccessibleModules() {
  const [modules, setModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        setLoading(true);
        setError(null);
        const accessibleModules =
          await groupAccessService.getAccessibleModules();
        setModules(accessibleModules);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao carregar módulos"
        );
        setModules([]);
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, []);

  return { modules, loading, error };
}

/**
 * Hook para obter telas acessíveis
 */
export function useAccessibleScreens() {
  const [screens, setScreens] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScreens = async () => {
      try {
        setLoading(true);
        setError(null);
        const accessibleScreens =
          await groupAccessService.getAccessibleScreens();
        setScreens(accessibleScreens);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar telas");
        setScreens([]);
      } finally {
        setLoading(false);
      }
    };

    fetchScreens();
  }, []);

  return { screens, loading, error };
}

/**
 * Hook para verificar se um módulo está oculto
 */
export function useIsModuleHidden(modulo: string) {
  const [isHidden, setIsHidden] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkHidden = async () => {
      try {
        setLoading(true);
        const hidden = await groupAccessService.isModuleHidden(modulo);
        setIsHidden(hidden);
      } catch (error) {
        console.error(
          `Erro ao verificar se módulo ${modulo} está oculto:`,
          error
        );
        setIsHidden(true);
      } finally {
        setLoading(false);
      }
    };

    checkHidden();
  }, [modulo]);

  return { isHidden, loading };
}

/**
 * Hook para verificar se uma tela está oculta
 */
export function useIsScreenHidden(screenName: string) {
  const [isHidden, setIsHidden] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkHidden = async () => {
      try {
        setLoading(true);
        const hidden = await groupAccessService.isScreenHidden(screenName);
        setIsHidden(hidden);
      } catch (error) {
        console.error(
          `Erro ao verificar se tela ${screenName} está oculta:`,
          error
        );
        setIsHidden(true);
      } finally {
        setLoading(false);
      }
    };

    checkHidden();
  }, [screenName]);

  return { isHidden, loading };
}

/**
 * Hook para verificar características do grupo
 */
export function useGroupCharacteristics() {
  const [characteristics, setCharacteristics] = useState({
    isFilialOnly: false,
    isReadOnly: false,
    shouldHideUsersTab: true,
    groupName: "Usuario",
    groupDescription: "",
    isAdmin: false,
    isConsultor: false,
    isGestorFilial: false,
    isAdministrativoFilial: false,
    isFinanceiro: false,
    isFaturamento: false,
    hasValidGroup: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCharacteristics = async () => {
      try {
        setLoading(true);

        const [
          isFilialOnly,
          isReadOnly,
          shouldHideUsersTab,
          groupName,
          groupDescription,
          isAdmin,
          isConsultor,
          isGestorFilial,
          isAdministrativoFilial,
          isFinanceiro,
          isFaturamento,
          hasValidGroup,
        ] = await Promise.all([
          groupAccessService.isFilialOnly(),
          groupAccessService.isReadOnly(),
          groupAccessService.shouldHideUsersTab(),
          groupAccessService.getGroupName(),
          groupAccessService.getGroupDescription(),
          groupAccessService.isAdmin(),
          groupAccessService.isConsultor(),
          groupAccessService.isGestorFilial(),
          groupAccessService.isAdministrativoFilial(),
          groupAccessService.isFinanceiro(),
          groupAccessService.isFaturamento(),
          groupAccessService.hasValidGroup(),
        ]);

        setCharacteristics({
          isFilialOnly,
          isReadOnly,
          shouldHideUsersTab,
          groupName,
          groupDescription,
          isAdmin,
          isConsultor,
          isGestorFilial,
          isAdministrativoFilial,
          isFinanceiro,
          isFaturamento,
          hasValidGroup,
        });
      } catch (error) {
        console.error("Erro ao obter características do grupo:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCharacteristics();
  }, []);

  return { characteristics, loading };
}
