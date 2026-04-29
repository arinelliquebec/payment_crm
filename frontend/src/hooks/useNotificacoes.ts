import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";

export interface Notificacao {
  id: number;
  tipo: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  dataCriacao: string;
  dataLeitura: string | null;
  prioridade: string;
  link: string | null;
  boletoId: number | null;
  contratoId: number | null;
  clienteId: number | null;
  nomeCliente: string | null;
}

// Helper para verificar se o usuário está autenticado
const isUserAuthenticated = (): boolean => {
  if (typeof window === "undefined") return false;
  const isAuth = localStorage.getItem("isAuthenticated") === "true";
  const user = localStorage.getItem("user");
  if (!isAuth || !user) return false;

  try {
    const userData = JSON.parse(user);
    const usuarioId =
      userData.UsuarioId || userData.usuarioId || userData.id || userData.Id;
    return !!usuarioId;
  } catch {
    return false;
  }
};

export function useNotificacoes(autoRefresh = true) {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [countNaoLidas, setCountNaoLidas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotificacoes = useCallback(async (apenasNaoLidas = false) => {
    // Não fazer requisição se o usuário não estiver autenticado
    if (!isUserAuthenticated()) {
      setLoading(false);
      setNotificacoes([]);
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.get<Notificacao[]>(
        `/Notificacao?apenasNaoLidas=${apenasNaoLidas}&limite=50`
      );
      // Extrair dados da resposta e garantir que é sempre um array
      const data = response.data;
      const notificacoesArray = Array.isArray(data) ? data : [];
      setNotificacoes(notificacoesArray);
      setError(response.error || null);
    } catch (err) {
      console.error("Erro ao buscar notificações:", err);
      setError("Erro ao carregar notificações");
      setNotificacoes([]); // Garantir array vazio em caso de erro
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCountNaoLidas = useCallback(async () => {
    // Não fazer requisição se o usuário não estiver autenticado
    if (!isUserAuthenticated()) {
      setCountNaoLidas(0);
      return;
    }

    try {
      const response = await apiClient.get<number>("/Notificacao/count");
      // Extrair dados da resposta
      const count = typeof response.data === "number" ? response.data : 0;
      setCountNaoLidas(count);
    } catch (err) {
      console.error("Erro ao buscar contagem de notificações:", err);
    }
  }, []);

  const marcarComoLida = useCallback(async (id: number) => {
    try {
      await apiClient.put(`/Notificacao/${id}/marcar-lida`, {});
      // Atualizar localmente
      setNotificacoes((prev) =>
        prev.map((n) =>
          n.id === id
            ? { ...n, lida: true, dataLeitura: new Date().toISOString() }
            : n
        )
      );
      setCountNaoLidas((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Erro ao marcar notificação como lida:", err);
    }
  }, []);

  const marcarTodasComoLidas = useCallback(async () => {
    try {
      await apiClient.put("/Notificacao/marcar-todas-lidas", {});
      // Atualizar localmente
      setNotificacoes((prev) =>
        prev.map((n) => ({
          ...n,
          lida: true,
          dataLeitura: new Date().toISOString(),
        }))
      );
      setCountNaoLidas(0);
    } catch (err) {
      console.error("Erro ao marcar todas as notificações como lidas:", err);
    }
  }, []);

  useEffect(() => {
    fetchNotificacoes();
    fetchCountNaoLidas();
  }, [fetchNotificacoes, fetchCountNaoLidas]);

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchCountNaoLidas();
      // Só atualiza a lista se estiver vazia ou se houver novas notificações
      if (notificacoes.length === 0) {
        fetchNotificacoes();
      }
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [autoRefresh, fetchCountNaoLidas, fetchNotificacoes, notificacoes.length]);

  return {
    notificacoes,
    countNaoLidas,
    loading,
    error,
    fetchNotificacoes,
    fetchCountNaoLidas,
    marcarComoLida,
    marcarTodasComoLidas,
    refresh: fetchNotificacoes,
  };
}
