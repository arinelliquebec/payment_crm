"use client";
import React, { createContext, useContext, ReactNode } from "react";
import { useAtividades, Atividade } from "@/hooks/useAtividades";

interface AtividadeContextType {
  atividades: Atividade[];
  adicionarAtividade: (
    usuario: string,
    acao: string,
    tipo?: "success" | "info" | "warning" | "error",
    detalhes?: string,
    moduloOrigem?: string
  ) => void;
  obterAtividadesRecentes: (limite?: number) => Atividade[];
  limparAtividades: () => void;
  removerAtividade: (id: string) => void;
}

const AtividadeContext = createContext<AtividadeContextType | undefined>(
  undefined
);

export function AtividadeProvider({ children }: { children: ReactNode }) {
  const {
    atividades,
    adicionarAtividade,
    obterAtividadesRecentes,
    limparAtividades,
    removerAtividade,
  } = useAtividades();

  return (
    <AtividadeContext.Provider
      value={{
        atividades,
        adicionarAtividade,
        obterAtividadesRecentes,
        limparAtividades,
        removerAtividade,
      }}
    >
      {children}
    </AtividadeContext.Provider>
  );
}

export function useAtividadeContext() {
  const context = useContext(AtividadeContext);
  if (context === undefined) {
    console.error(
      "useAtividadeContext deve ser usado dentro de um AtividadeProvider"
    );
    // Retornar um contexto padrão em vez de lançar erro
    return {
      atividades: [],
      adicionarAtividade: () => {},
      obterAtividadesRecentes: () => [],
      limparAtividades: () => {},
      removerAtividade: () => {},
    };
  }
  return context;
}
