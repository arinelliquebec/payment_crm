// src/contexts/AuthContext.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { apiClient } from "@/lib/api";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  login: string;
  email: string;
  grupoAcesso: string;
  tipoPessoa: string;
  nome: string;
  ativo: boolean;
  ultimoAcesso?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (loginData: {
    login: string;
    senha: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  checkAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  // Verificar autenticação ao carregar
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    try {
      const storedUser = localStorage.getItem("user");
      const isAuth = localStorage.getItem("isAuthenticated");

      if (storedUser && isAuth === "true") {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      }
    } catch (error) {
      console.error("Erro ao verificar autenticação:", error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (loginData: {
    login: string;
    senha: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiClient.post("/Usuario/login", loginData);

      if (response.error) {
        return { success: false, error: response.error };
      }

      if (
        response.data &&
        typeof response.data === "object" &&
        "usuario" in response.data
      ) {
        const userData = (response.data as any).usuario;
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("isAuthenticated", "true");
        return { success: true };
      }

      return { success: false, error: "Resposta inválida do servidor" };
    } catch (error) {
      return { success: false, error: "Erro de conexão com o servidor" };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("isAuthenticated");
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        checkAuth,
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
