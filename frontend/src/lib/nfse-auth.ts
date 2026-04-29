import logger from "./logger";

const NFSE_API_URL = (process.env.NFSE_API_URL ?? "").replace(/\/+$/, "");
const JWT_ACESS = process.env.JWT_ACESS ?? "";
const JWT_PASSWD = process.env.JWT_PASSWD ?? "";

let cachedToken: string | null = null;
let tokenExpirationTime: number | null = null;

/**
 * Utilitário para autenticar na API .NET no Azure e obter o JWT.
 * Realiza o cache do token (expiração padrão de 15 minutos).
 */
export async function getNfseToken(forceRefresh = false): Promise<string> {
  if (!NFSE_API_URL || !JWT_ACESS || !JWT_PASSWD) {
    throw new Error(
      "Credenciais da API NFS-e não configuradas no .env (NFSE_API_URL, JWT_ACESS, JWT_PASSWD)",
    );
  }

  const now = Date.now();
  // Se não foi pedido refresh forçado e o token existe e ainda é válido (damos 1 minuto de margem)
  if (
    !forceRefresh &&
    cachedToken &&
    tokenExpirationTime &&
    now < tokenExpirationTime
  ) {
    return cachedToken;
  }

  try {
    // Endpoint assumido como /api/Auth/login ou similar
    // Ajuste se o endpoint da sua API for diferente
    const authUrl = `${NFSE_API_URL}/api/Auth/login`;
    
    logger.log(`[nfse-auth] Solicitando novo token em: ${authUrl}`);
    
    const response = await fetch(authUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: JWT_ACESS,
        password: JWT_PASSWD,
      }),
    });

    if (!response.ok) {
      throw new Error(`Falha ao obter token (Status: ${response.status})`);
    }

    const data = await response.json();
    const token = data.token || data.accessToken || data.Token || data.jwt;
    
    if (!token) {
      throw new Error("Token não encontrado na resposta");
    }

    cachedToken = token;
    // O usuário relatou tempo de 15 minutos. Usamos 13 minutos (13 * 60 * 1000) 
    // para dar uma folga na renovação antes que expire.
    tokenExpirationTime = now + 13 * 60 * 1000;

    logger.log("[nfse-auth] Token JWT da NFS-e atualizado com sucesso");
    return token;
  } catch (error) {
    logger.error("[nfse-auth] Erro ao autenticar na API NFSe do Azure", error);
    throw error;
  }
}
