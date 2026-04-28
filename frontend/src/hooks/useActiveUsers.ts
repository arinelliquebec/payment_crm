import { useState, useEffect, useCallback, useMemo } from "react";
import { useUsuario } from "./useUsuario";

// Considerar usuário "online" se teve atividade nos últimos 15 minutos
const ONLINE_THRESHOLD_MINUTES = 15;

export function useActiveUsers() {
  const { usuarios, loading, fetchUsuarios } = useUsuario();
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(
    null
  );

  // Calcular usuários únicos que estão realmente ativos/online
  const activeUsers = useMemo(() => {
    if (!usuarios || usuarios.length === 0) return [];

    const now = new Date();
    const thresholdTime = new Date(
      now.getTime() - ONLINE_THRESHOLD_MINUTES * 60 * 1000
    );

    return usuarios.filter((usuario) => {
      // Usuário deve estar ativo no sistema
      if (!usuario.ativo) return false;

      // Se não tem ultimoAcesso, considerar como offline
      if (!usuario.ultimoAcesso) return false;

      // Verificar se o último acesso foi dentro do threshold
      const lastAccess = new Date(usuario.ultimoAcesso);
      return lastAccess >= thresholdTime;
    });
  }, [usuarios]);

  // Contagem de sessões ativas (usuários únicos online)
  const activeSessions = useMemo(() => {
    return activeUsers.length;
  }, [activeUsers]);

  // Função para atualizar dados
  const refreshData = useCallback(async () => {
    try {
      await fetchUsuarios();
    } catch (error) {
      console.error("Erro ao atualizar dados de usuários ativos:", error);
    }
  }, [fetchUsuarios]);

  // Inicializar e configurar refresh automático
  useEffect(() => {
    // Buscar dados iniciais
    refreshData();

    // Configurar refresh a cada 2 minutos para dados em tempo real
    const interval = setInterval(() => {
      refreshData();
    }, 2 * 60 * 1000); // 2 minutos

    setRefreshInterval(interval);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [refreshData]);

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [refreshInterval]);

  // Informações detalhadas dos usuários online
  const onlineUserDetails = useMemo(() => {
    return activeUsers.map((usuario) => ({
      id: usuario.id,
      name:
        usuario.pessoaFisica?.nome ||
        usuario.pessoaJuridica?.razaoSocial ||
        usuario.login,
      login: usuario.login,
      email: usuario.email,
      lastAccess: usuario.ultimoAcesso,
      userType: usuario.tipoPessoa,
    }));
  }, [activeUsers]);

  return {
    activeSessions,
    activeUsers,
    onlineUserDetails,
    loading,
    refreshData,
    lastUpdated: new Date(),
  };
}

