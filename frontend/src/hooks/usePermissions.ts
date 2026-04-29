import { useState, useEffect, useCallback } from "react";
import {
  UsuarioPermissoes,
  VerificacaoPermissao,
  GrupoAcesso,
  Permissao,
  RotaPermissao,
  ModuloType,
  AcaoType,
} from "@/types/permissions";
import { permissionService } from "@/services/permission.service";

/**
 * Hook principal para gerenciar permissões do usuário
 */
export function usePermissions() {
  const [permissoes, setPermissoes] = useState<UsuarioPermissoes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPermissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const userPermissions = await permissionService.getUserPermissions();
      setPermissoes(userPermissions);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar permissões"
      );
      console.error("Erro ao carregar permissões:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshPermissions = useCallback(() => {
    permissionService.invalidateCache();
    loadPermissions();
  }, [loadPermissions]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  return {
    permissoes,
    loading,
    error,
    refreshPermissions,
    loadPermissions,
  };
}

/**
 * Hook para verificar permissões específicas
 */
export function usePermissionCheck() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasPermission = useCallback(
    async (modulo: ModuloType, acao: AcaoType): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);
        return await permissionService.hasPermission(modulo, acao);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao verificar permissão"
        );
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const checkPermission = useCallback(
    async (
      modulo: ModuloType,
      acao: AcaoType
    ): Promise<VerificacaoPermissao> => {
      try {
        setLoading(true);
        setError(null);
        return await permissionService.checkPermission(modulo, acao);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao verificar permissão"
        );
        return { hasPermission: false };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const canAccessRecord = useCallback(
    async (modulo: ModuloType, recordId: number): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);
        return await permissionService.canAccessRecord(modulo, recordId);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao verificar acesso"
        );
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    hasPermission,
    checkPermission,
    canAccessRecord,
    loading,
    error,
  };
}

/**
 * Hook para ações específicas (CRUD)
 */
export function useCrudPermissions(modulo: ModuloType) {
  const [permissions, setPermissions] = useState({
    canView: false,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    isReadOnly: false,
    isFilialOnly: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCrudPermissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [canView, canCreate, canEdit, canDelete, isReadOnly, isFilialOnly] =
        await Promise.all([
          permissionService.canView(modulo),
          permissionService.canCreate(modulo),
          permissionService.canEdit(modulo),
          permissionService.canDelete(modulo),
          permissionService.isReadOnly(modulo),
          permissionService.isFilialOnly(modulo),
        ]);

      setPermissions({
        canView,
        canCreate,
        canEdit,
        canDelete,
        isReadOnly,
        isFilialOnly,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar permissões CRUD"
      );
      console.error("Erro ao carregar permissões CRUD:", err);
    } finally {
      setLoading(false);
    }
  }, [modulo]);

  useEffect(() => {
    loadCrudPermissions();
  }, [loadCrudPermissions]);

  return {
    ...permissions,
    loading,
    error,
    refresh: loadCrudPermissions,
  };
}

/**
 * Hook para gerenciar grupos de acesso
 */
export function useGruposAcesso() {
  const [grupos, setGrupos] = useState<GrupoAcesso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGrupos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const gruposData = await permissionService.getGruposAcesso();
      setGrupos(gruposData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar grupos");
      console.error("Erro ao carregar grupos de acesso:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGrupos();
  }, [loadGrupos]);

  return {
    grupos,
    loading,
    error,
    refresh: loadGrupos,
  };
}

/**
 * Hook para gerenciar permissões disponíveis
 */
export function usePermissoesDisponiveis() {
  const [permissoes, setPermissoes] = useState<Permissao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPermissoes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const permissoesData = await permissionService.getPermissoes();
      setPermissoes(permissoesData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar permissões"
      );
      console.error("Erro ao carregar permissões disponíveis:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPermissoes();
  }, [loadPermissoes]);

  return {
    permissoes,
    loading,
    error,
    refresh: loadPermissoes,
  };
}

/**
 * Hook para navegação com permissões
 */
export function useNavigationPermissions() {
  const [rotas, setRotas] = useState<RotaPermissao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRotas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const rotasData = await permissionService.getAvailableRoutes();
      setRotas(rotasData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar rotas");
      console.error("Erro ao carregar rotas disponíveis:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const canAccessRoute = useCallback(
    async (path: string): Promise<boolean> => {
      const rota = rotas.find((r) => r.path === path);
      return !!rota;
    },
    [rotas]
  );

  useEffect(() => {
    loadRotas();
  }, [loadRotas]);

  return {
    rotas,
    loading,
    error,
    canAccessRoute,
    refresh: loadRotas,
  };
}

/**
 * Hook para informações do usuário atual
 */
export function useCurrentUser() {
  const { permissoes, loading, error } = usePermissions();

  return {
    usuario: permissoes
      ? {
          id: permissoes.usuarioId,
          nome: permissoes.nome,
          login: permissoes.login,
          grupo: permissoes.grupo,
          filial: permissoes.filial,
          semPermissao: permissoes.semPermissao,
          mensagem: permissoes.mensagem,
        }
      : null,
    loading,
    error,
  };
}
