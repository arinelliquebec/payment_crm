import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export interface SessaoAtiva {
  id: number;
  usuarioId: number;
  nomeUsuario: string;
  email: string;
  ultimoAcesso: string | null;
  perfil: string;
  inicioSessao: string | null;
  ultimaAtividade: string;
  tempoOnline: string;
  enderecoIP: string | null;
  paginaAtual?: string | null;
  estaOnline?: boolean;
  sessaoId?: number;
}

export function useSessoesAtivas(incluirInativos: boolean = false) {
  const { permissoes } = useAuth();
  const [sessoes, setSessoes] = useState<SessaoAtiva[]>([]);
  const [count, setCount] = useState(0);
  const [countOnline, setCountOnline] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countError, setCountError] = useState(false);

  // Verificar se o usuário é administrador
  const isAdmin = permissoes?.grupo === "Administrador";

  const fetchSessoes = async () => {
    // Apenas administradores podem buscar sessões
    if (!isAdmin) {
      console.log(
        "🔒 useSessoesAtivas: Usuário não é administrador, bloqueando acesso"
      );
      setSessoes([]);
      setCount(0);
      setCountOnline(0);
      setLoading(false);
      setError("Apenas administradores podem visualizar sessões ativas");
      return;
    }

    try {
      setLoading(true);
      console.log("🔍 useSessoesAtivas: Buscando sessões ativas...");
      console.log("🔍 useSessoesAtivas: incluirInativos =", incluirInativos);

      const baseEndpoint = "/SessaoAtiva";
      const historicoEndpoint = "/SessaoAtiva/historico";

      // Usar endpoint de histórico para incluir usuários offline
      let endpoint = incluirInativos ? historicoEndpoint : baseEndpoint;
      console.log("🔍 useSessoesAtivas: Endpoint =", endpoint);
      let response = await apiClient.get<SessaoAtiva[]>(endpoint);

      const historicoFalhou =
        incluirInativos &&
        (response.error ||
          (response.status ?? 0) >= 400 ||
          !Array.isArray(response.data));

      if (historicoFalhou) {
        console.warn(
          "⚠️ useSessoesAtivas: Falha ao carregar histórico completo, fazendo fallback para sessões ativas.",
          {
            status: response.status,
            error: response.error,
          }
        );
        endpoint = baseEndpoint;
        response = await apiClient.get<SessaoAtiva[]>(endpoint);
        setError(
          "Histórico indisponível temporariamente. Mostrando apenas usuários online."
        );
      } else {
        setError(null);
      }

      console.log(
        "✅ useSessoesAtivas: Resposta recebida:",
        response.data?.length || 0,
        "sessões"
      );

      if (response.data && Array.isArray(response.data)) {
        console.log("📊 useSessoesAtivas: Dados recebidos:", response.data);
        setSessoes(response.data);

        if (incluirInativos && endpoint === historicoEndpoint) {
          // Contar usuários online e total
          const online = response.data.filter((s) => s.estaOnline === true).length;
          console.log(`📊 useSessoesAtivas: ${online} online de ${response.data.length} total (histórico)`);
          setCountOnline(online);
          setCount(response.data.length);
        } else {
          // Endpoint base: todas as sessões retornadas são ativas/online
          const totalSessoes = response.data.length;
          console.log(`📊 useSessoesAtivas: ${totalSessoes} sessões ativas (endpoint base)`);
          setCount(totalSessoes);
          // No endpoint base, todas são online por definição
          setCountOnline(totalSessoes);
        }
      } else {
        console.warn("⚠️ useSessoesAtivas: Resposta inválida ou vazia");
        setSessoes([]);
        setCount(0);
        setCountOnline(0);
      }
    } catch (err) {
      console.error("Erro ao buscar sessões:", err);
      setError("Erro ao carregar sessões");
      setSessoes([]);
      setCount(0);
      setCountOnline(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchCount = async () => {
    // Apenas administradores podem buscar contagem
    if (!isAdmin) {
      return;
    }

    // Se já houve erro de contagem, não tentar novamente
    if (countError) {
      return;
    }

    try {
      const response = await apiClient.get<number>("/SessaoAtiva/count");
      if (typeof response.data === "number") {
        setCount(response.data);
        setCountError(false);
      }
    } catch (err) {
      console.warn("Erro ao buscar contagem de sessões (não crítico):", err);
      setCountError(true);
      // Usar contagem baseada no array de sessões
      setCount(sessoes.length);
    }
  };

  useEffect(() => {
    // Apenas buscar se for administrador
    if (!isAdmin) {
      setLoading(false);
      setSessoes([]);
      setCount(0);
      setCountOnline(0);
      return;
    }

    fetchSessoes();

    // Atualizar a cada 15 segundos para melhor responsividade
    const interval = setInterval(() => {
      if (isAdmin) {
        fetchSessoes();
        if (!countError && !incluirInativos) {
          fetchCount();
        }
      }
    }, 15000); // 15 segundos

    return () => clearInterval(interval);
  }, [countError, incluirInativos, isAdmin, permissoes?.grupo]);

  return {
    sessoes,
    count,
    countOnline,
    loading,
    error,
    countError,
    refetch: fetchSessoes,
  };
}
