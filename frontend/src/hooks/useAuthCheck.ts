import { useState, useEffect } from "react";

interface AuthCheckResult {
  isAuthenticated: boolean;
  userId: number | null;
  userData: any | null;
  isLoading: boolean;
}

/**
 * Hook para verificar o status de autenticação do usuário
 */
export function useAuthCheck(): AuthCheckResult {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const authStatus = localStorage.getItem("isAuthenticated");
        const user = localStorage.getItem("user");

        const authenticated = authStatus === "true";
        setIsAuthenticated(authenticated);

        if (authenticated && user) {
          try {
            const parsedUser = JSON.parse(user);
            setUserData(parsedUser);

            // Tentar diferentes propriedades para o ID
            const id =
              parsedUser.id ||
              parsedUser.Id ||
              parsedUser.usuarioId ||
              parsedUser.userId;
            setUserId(id || null);
          } catch (error) {
            console.error("Erro ao fazer parse do usuário:", error);
            setUserData(null);
            setUserId(null);
          }
        } else {
          setUserData(null);
          setUserId(null);
        }
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
        setIsAuthenticated(false);
        setUserData(null);
        setUserId(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Escutar mudanças no localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "isAuthenticated" || e.key === "user") {
        checkAuth();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return {
    isAuthenticated,
    userId,
    userData,
    isLoading,
  };
}

/**
 * Hook para verificar se o usuário tem um ID válido
 */
export function useUserId(): number | null {
  const { userId, isAuthenticated } = useAuthCheck();

  return isAuthenticated ? userId : null;
}

/**
 * Hook para verificar se deve carregar permissões
 */
export function useShouldLoadPermissions(): boolean {
  const { isAuthenticated, userId, isLoading } = useAuthCheck();

  return !isLoading && isAuthenticated && userId !== null;
}
