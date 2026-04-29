"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { Cliente, PessoaFisica, PessoaJuridica } from "@/types/api";

// Interface para dados do cliente autenticado
export interface ClienteAutenticado {
  id: number;
  tipoPessoa: "Fisica" | "Juridica";
  nome: string;
  documento: string; // CPF ou CNPJ
  email: string;
  telefone?: string;
  pessoaFisica?: PessoaFisica;
  pessoaJuridica?: PessoaJuridica;
  filialId?: number;
  dataCadastro: string;
}

interface ClienteAuthContextType {
  cliente: ClienteAutenticado | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (documento: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

const ClienteAuthContext = createContext<ClienteAuthContextType | undefined>(
  undefined
);

const STORAGE_KEY = "portalCliente_auth";

// Helper para formatar CPF
const formatCPF = (cpf: string): string => {
  const cleaned = cpf.replace(/\D/g, "");
  if (cleaned.length !== 11) return cpf;
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

// Helper para formatar CNPJ
const formatCNPJ = (cnpj: string): string => {
  const cleaned = cnpj.replace(/\D/g, "");
  if (cleaned.length !== 14) return cnpj;
  return cleaned.replace(
    /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
    "$1.$2.$3/$4-$5"
  );
};

// Helper para limpar documento (apenas números)
const cleanDocumento = (documento: string): string => {
  return documento.replace(/\D/g, "");
};

// Identificar tipo de documento
const getTipoDocumento = (documento: string): "CPF" | "CNPJ" | null => {
  const cleaned = cleanDocumento(documento);
  if (cleaned.length === 11) return "CPF";
  if (cleaned.length === 14) return "CNPJ";
  return null;
};

export function ClienteAuthProvider({ children }: { children: ReactNode }) {
  const [cliente, setCliente] = useState<ClienteAutenticado | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Restaurar sessão do localStorage
  useEffect(() => {
    const storedAuth = localStorage.getItem(STORAGE_KEY);
    if (storedAuth) {
      try {
        const parsedAuth = JSON.parse(storedAuth);
        setCliente(parsedAuth);
      } catch (e) {
        console.error("Erro ao restaurar sessão do cliente:", e);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  // Login do cliente por CPF ou CNPJ (sem senha)
  const login = useCallback(async (documento: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    const tipoDocumento = getTipoDocumento(documento);

    if (!tipoDocumento) {
      setError(
        "Documento inválido. Digite um CPF (11 dígitos) ou CNPJ (14 dígitos)."
      );
      setIsLoading(false);
      return false;
    }

    try {
      const response = await fetch("/api/portal-cliente/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documento: cleanDocumento(documento),
          tipoDocumento,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao autenticar. Tente novamente.");
        setIsLoading(false);
        return false;
      }

      // Salvar no estado e localStorage
      setCliente(data.cliente);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.cliente));
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error("Erro na autenticação do cliente:", err);
      setError("Erro de conexão. Verifique sua internet e tente novamente.");
      setIsLoading(false);
      return false;
    }
  }, []);

  // Logout
  const logout = useCallback(() => {
    setCliente(null);
    localStorage.removeItem(STORAGE_KEY);
    setError(null);
  }, []);

  // Limpar erro
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <ClienteAuthContext.Provider
      value={{
        cliente,
        isAuthenticated: !!cliente,
        isLoading,
        error,
        login,
        logout,
        clearError,
      }}
    >
      {children}
    </ClienteAuthContext.Provider>
  );
}

export function useClienteAuth() {
  const context = useContext(ClienteAuthContext);
  if (context === undefined) {
    throw new Error(
      "useClienteAuth deve ser usado dentro de um ClienteAuthProvider"
    );
  }
  return context;
}

// Exportar helpers
export { formatCPF, formatCNPJ, cleanDocumento, getTipoDocumento };
