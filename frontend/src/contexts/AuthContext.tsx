// src/contexts/AuthContext.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { apiClient } from "@/lib/api";
import { useRouter } from "next/navigation";
import { UsuarioPermissoes } from "@/types/permissions";
import { permissionService } from "@/services/permission.service";
import { userService } from "@/services/user.service";
import { useAuthCheck } from "@/hooks/useAuthCheck";

// Auth via route handlers same-origin (`/api/auth/*`): cookie httpOnly bff_session.
async function authApiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string; status: number }> {
  const url = `/api${path}`;
  try {
    const res = await fetch(url, {
      ...options,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...options.headers },
    });
    const text = await res.text();
    const data = text ? (JSON.parse(text) as T) : undefined;
    if (!res.ok) {
      const msg =
        (data as any)?.message ?? text ?? `Erro ${res.status}`;
      return { error: String(msg), status: res.status };
    }
    return { data, status: res.status };
  } catch (err: any) {
    return { error: err.message ?? "Erro de rede", status: 0 };
  }
}

interface User {
  id: number; // Normalizado de usuarioId
  usuarioId?: number; // Campo original do backend (para compatibilidade)
  login: string;
  email: string;
  grupoAcesso: string;
  tipoPessoa: string;
  nome: string;
  ativo: boolean;
  ultimoAcesso?: string;
  ultimoAcessoAnterior?: string; // Último acesso antes do login atual
}

interface AuthContextType {
  user: User | null;
  permissoes: UsuarioPermissoes | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissoesLoading: boolean;
  login: (loginData: {
    login: string;
    senha: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  checkAuth: () => void;
  refreshPermissions: () => Promise<void>;
  hasPermission: (modulo: string, acao: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [permissoes, setPermissoes] = useState<UsuarioPermissoes | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissoesLoading, setPermissoesLoading] = useState(false);
  const router = useRouter();
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const heartbeatFailureCount = useRef<number>(0);
  const MAX_HEARTBEAT_FAILURES = 3;

  const isAuthenticated = !!user;

  // Função helper centralizada para obter nome da página atual
  const getCurrentPageName = () => {
      if (typeof window !== "undefined") {
        const pathname = window.location.pathname;
        const cleanPath = pathname.replace(/^\/|\/$/g, "");
        const routeMap: Record<string, string> = {
          "": "Dashboard",
          dashboard: "Dashboard",
          contratos: "Contratos",
          clientes: "Clientes",
          usuarios: "Usuários",
          consultores: "Consultores",
          parceiros: "Parceiros",
          boletos: "Boletos",
          "cadastros/pessoa-fisica": "Cadastro - Pessoa Física",
          "cadastros/pessoa-juridica": "Cadastro - Pessoa Jurídica",
          cadastro: "Cadastro",
        "dashboard/financeiro": "Dashboard - Financeiro",
        "dashboard/financeiro/mapas-faturamento": "Mapas de Faturamento",
        "gestao/historico-cliente": "Histórico do Cliente",
        "gestao/comissoes": "Comissões",
          login: "Login",
        };
      return (
        routeMap[cleanPath] ||
        cleanPath
          .split("/")
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
          .join(" - ")
      );
      }
    return "Dashboard";
    };

  // Função para iniciar heartbeat com proteção contra falhas contínuas
  const startHeartbeat = (userId: number) => {
    // Limpar intervalo anterior se existir
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
    }

    // Reset do contador de falhas
    heartbeatFailureCount.current = 0;

    // Função para obter página atual - usa a função helper centralizada
    const getCurrentPage = () => getCurrentPageName();

    // Enviar heartbeat imediatamente e a cada 2 minutos (mais frequente para melhor detecção)
    const sendHeartbeat = async () => {
      try {
        const paginaAtual = getCurrentPage();
        await apiClient.put(`/SessaoAtiva/atualizar/${userId}`, {
          paginaAtual: paginaAtual,
        });
        heartbeatFailureCount.current = 0; // Reset em caso de sucesso
      } catch (error) {
        heartbeatFailureCount.current++;
        console.error(
          `Erro ao atualizar sessão (${heartbeatFailureCount.current}/${MAX_HEARTBEAT_FAILURES}):`,
          error
        );

        // Se atingir o máximo de falhas, parar heartbeat
        if (heartbeatFailureCount.current >= MAX_HEARTBEAT_FAILURES) {
          console.warn("Heartbeat desabilitado após múltiplas falhas");
          stopHeartbeat();
        }
      }
    };

    // Enviar heartbeat imediatamente
    sendHeartbeat();

    // Continuar enviando a cada 2 minutos
    heartbeatInterval.current = setInterval(sendHeartbeat, 2 * 60 * 1000); // 2 minutos
  };

  // Função para parar heartbeat
  const stopHeartbeat = () => {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = null;
    }
  };

  // Verificar autenticação ao carregar
  useEffect(() => {
    const initAuth = async () => {
      await checkAuth();
    };
    initAuth();
  }, []);

  // Carregar permissões quando o usuário estiver autenticado
  // Otimizado: usa apenas id ao invés do objeto user completo
  useEffect(() => {
    if (isAuthenticated && user && !permissoes) {
      loadPermissions();
    } else if (!isAuthenticated) {
      setPermissoes(null);
      permissionService.invalidateCache();
    }
  }, [isAuthenticated, user?.id]);

  // Limpar heartbeat ao desmontar componente
  useEffect(() => {
    return () => {
      stopHeartbeat();
    };
  }, []);

  const checkAuth = async () => {
    try {
      // Verifica a sessão perguntando ao BFF (lê o cookie httpOnly)
      const { data, error } = await authApiFetch<User>("/auth/me");

      if (error || !data) {
        // Cookie inexistente ou expirado — limpar estado local
        setUser(null);
        localStorage.removeItem("user");
        localStorage.removeItem("isAuthenticated");
        return;
      }

      const normalizedUser = { ...data, id: data.id ?? (data as any).usuarioId };
      setUser(normalizedUser);
      localStorage.setItem("user", JSON.stringify(normalizedUser));
      localStorage.setItem("isAuthenticated", "true");

      // Registrar/atualizar sessão ativa no .NET via BFF proxy
      try {
        const nomeUsuario = normalizedUser.nome || normalizedUser.login || "Usuário";
        await apiClient.post("/SessaoAtiva/registrar", {
          usuarioId: normalizedUser.id,
          nomeUsuario,
          email: normalizedUser.email || "",
          perfil: normalizedUser.grupoAcesso || "Usuário",
          tokenSessao: "",
        });

        setTimeout(async () => {
          try {
            const paginaAtual = getCurrentPageName();
            await apiClient.put(`/SessaoAtiva/atualizar/${normalizedUser.id}`, {
              paginaAtual,
            });
          } catch {}
        }, 500);

        startHeartbeat(normalizedUser.id);
      } catch (error) {
        console.error("Erro ao registrar sessão após reload:", error);
      }
    } catch (error) {
      console.error("Erro ao verificar autenticação:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPermissions = async () => {
    try {
      setPermissoesLoading(true);
      const userPermissions = await permissionService.getUserPermissions();
      setPermissoes(userPermissions);
    } catch (error) {
      console.error("Erro ao carregar permissões:", error);
      // Em caso de erro, definir permissões vazias para evitar quebrar a aplicação
      setPermissoes({
        usuarioId: 0,
        nome: "Erro ao carregar",
        login: "error",
        grupo: "Usuario",
        filial: undefined,
        semPermissao: true,
        mensagem: "Erro ao carregar permissões",
        permissoes: [],
      });
    } finally {
      setPermissoesLoading(false);
    }
  };

  const refreshPermissions = async () => {
    permissionService.invalidateCache();

    // Atualizar dados do usuário usando o novo serviço
    try {
      const updatedUserData = await userService.getCurrentUserData();
      if (updatedUserData) {
        setUser(updatedUserData as any);
        localStorage.setItem("user", JSON.stringify(updatedUserData));
        console.log("✅ Dados do usuário atualizados:", updatedUserData);
      }
    } catch (error) {
      console.warn("Erro ao atualizar dados do usuário:", error);
    }

    await loadPermissions();
  };

  const hasPermission = (modulo: string, acao: string): boolean => {
    if (!permissoes || permissoes.semPermissao) {
      return false;
    }

    const permissaoCompleta = `${modulo}_${acao}`;
    return permissoes.permissoes.includes(permissaoCompleta);
  };

  const login = async (loginData: {
    login: string;
    senha: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      // BFF seta o cookie httpOnly e retorna { success, user }
      const response = await authApiFetch<{ success: boolean; user: User }>(
        "/auth/login",
        { method: "POST", body: JSON.stringify(loginData) }
      );

      if (response.error || !response.data?.success) {
        return { success: false, error: response.error ?? "Credenciais inválidas" };
      }

      const userData = response.data.user;
      const normalizedUser = {
        ...userData,
        id: (userData as any).usuarioId ?? (userData as any).id ?? 0,
      };

      setUser(normalizedUser);
      localStorage.setItem("user", JSON.stringify(normalizedUser));
      localStorage.setItem("isAuthenticated", "true");

      // Registrar sessão ativa no .NET via BFF proxy
      try {
        await apiClient.post("/SessaoAtiva/registrar", {
          usuarioId: normalizedUser.id,
          nomeUsuario: normalizedUser.nome,
          email: normalizedUser.email,
          perfil: normalizedUser.grupoAcesso,
          tokenSessao: "",
        });

        setTimeout(async () => {
          try {
            const paginaAtual = getCurrentPageName();
            await apiClient.put(`/SessaoAtiva/atualizar/${normalizedUser.id}`, {
              paginaAtual,
            });
          } catch {}
        }, 500);
      } catch (error) {
        console.error("Erro ao registrar sessão:", error);
      }

      startHeartbeat(normalizedUser.id);
      permissionService.invalidateCache();
      await loadPermissions();

      return { success: true };
    } catch (error) {
      return { success: false, error: "Erro de conexão com o servidor" };
    }
  };

  const logout = async () => {
    // Remover sessão ativa no .NET via BFF proxy
    if (user?.id) {
      try {
        await apiClient.delete(`/SessaoAtiva/remover/${user.id}`);
      } catch (error) {
        console.error("Erro ao remover sessão:", error);
      }
    }

    // Invalidar cookie httpOnly no BFF
    await authApiFetch("/auth/logout", { method: "POST" }).catch(() => {});

    stopHeartbeat();

    setUser(null);
    setPermissoes(null);
    permissionService.invalidateCache();
    localStorage.removeItem("user");
    localStorage.removeItem("isAuthenticated");
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        permissoes,
        isAuthenticated,
        isLoading,
        permissoesLoading,
        login,
        logout,
        checkAuth,
        refreshPermissions,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
