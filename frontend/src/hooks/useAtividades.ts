import { useState, useEffect, useCallback } from "react";

export interface Atividade {
  id: string;
  usuario: string;
  acao: string;
  timestamp: Date;
  tipo: "success" | "info" | "warning" | "error";
  detalhes?: string;
  moduloOrigem?: string;
}

export function useAtividades() {
  const [atividades, setAtividades] = useState<Atividade[]>([]);

  // Carregar atividades do localStorage ao inicializar
  useEffect(() => {
    const atividadesSalvas = localStorage.getItem("crm_atividades");
    if (atividadesSalvas) {
      try {
        const atividadesParseadas = JSON.parse(atividadesSalvas).map(
          (ativ: any) => ({
            ...ativ,
            timestamp: new Date(ativ.timestamp),
          })
        );
        setAtividades(atividadesParseadas);
      } catch (error) {
        console.error("Erro ao carregar atividades:", error);
      }
    }
  }, []);

  // Salvar atividades no localStorage sempre que houver mudanças
  useEffect(() => {
    if (atividades.length > 0) {
      localStorage.setItem("crm_atividades", JSON.stringify(atividades));
    }
  }, [atividades]);

  // Função para adicionar nova atividade
  const adicionarAtividade = useCallback(
    (
      usuario: string,
      acao: string,
      tipo: "success" | "info" | "warning" | "error" = "info",
      detalhes?: string,
      moduloOrigem?: string
    ) => {
      const novaAtividade: Atividade = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        usuario,
        acao,
        timestamp: new Date(),
        tipo,
        detalhes,
        moduloOrigem,
      };

      setAtividades((prev) => {
        const novasAtividades = [novaAtividade, ...prev];
        // Manter apenas as 50 atividades mais recentes
        return novasAtividades.slice(0, 50);
      });
    },
    []
  );

  // Função para obter atividades ordenadas por data (mais recente primeiro)
  const obterAtividadesRecentes = useCallback(
    (limite: number = 10) => {
      return atividades
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limite);
    },
    [atividades]
  );

  // Função para limpar todas as atividades
  const limparAtividades = useCallback(() => {
    setAtividades([]);
    localStorage.removeItem("crm_atividades");
  }, []);

  // Função para remover atividade específica
  const removerAtividade = useCallback((id: string) => {
    setAtividades((prev) => prev.filter((ativ) => ativ.id !== id));
  }, []);

  return {
    atividades,
    adicionarAtividade,
    obterAtividadesRecentes,
    limparAtividades,
    removerAtividade,
  };
}
