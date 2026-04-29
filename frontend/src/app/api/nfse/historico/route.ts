import { NextRequest, NextResponse } from "next/server";
import { getNfseToken } from "@/lib/nfse-auth";
import logger from "@/lib/logger";
import {
  errorResponse,
  exceptionToErrorResponse,
} from "@/lib/api-proxy-error";

const NFSE_API_BASE_URL = (process.env.NFSE_API_URL ?? "").replace(/\/+$/, "");

export async function POST(req: NextRequest) {
  if (!NFSE_API_BASE_URL) {
    return errorResponse(503, {
      error: "API de NFS-e não configurada no .env.",
      type: "config_error",
    });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return errorResponse(400, {
      error: "Corpo da requisição inválido. Verifique os campos e tente novamente.",
      type: "validation_error",
    });
  }

  const metodo = (body.metodo as string | undefined) ?? "empresaId";
  const dataInicio = body.dataInicio as string | undefined;
  const dataFim = body.dataFim as string | undefined;

  let pathSegment: string;

  switch (metodo) {
    case "empresaId": {
      const empresaId = (body.empresaId as string | undefined)?.trim();
      if (!empresaId) {
        return errorResponse(400, {
          error: "empresaId é obrigatório.",
          type: "validation_error",
        });
      }
      pathSegment = encodeURIComponent(empresaId);
      break;
    }
    case "cnpj": {
      const cnpj = (body.cnpj as string | undefined)?.replace(/\D/g, "").trim();
      if (!cnpj || cnpj.length !== 14) {
        return errorResponse(400, {
          error: "CNPJ inválido.",
          type: "validation_error",
        });
      }
      pathSegment = `cnpj/${encodeURIComponent(cnpj)}`;
      break;
    }
    case "nome": {
      const nome = (body.nome as string | undefined)?.trim();
      if (!nome) {
        return errorResponse(400, {
          error: "Nome é obrigatório.",
          type: "validation_error",
        });
      }
      pathSegment = `nome/${encodeURIComponent(nome)}`;
      break;
    }
    default:
      return errorResponse(400, {
        error: `Método inválido: ${metodo}`,
        type: "validation_error",
      });
  }

  let jwtToken: string;
  try {
    jwtToken = await getNfseToken();
  } catch (authError: any) {
    logger.error("[Histórico NFS-e] Auth error", authError);
    return errorResponse(502, {
      error: "Falha na autenticação com o serviço de NFS-e.",
      type: "auth_error",
      details: { message: authError?.message },
    });
  }

  try {
    let apiUrl = `${NFSE_API_BASE_URL}/api/NFSe/historico/${pathSegment}`;
    const params = new URLSearchParams();
    if (dataInicio) params.set("dataInicio", dataInicio);
    if (dataFim) params.set("dataFim", dataFim);
    const qs = params.toString();
    if (qs) apiUrl += `?${qs}`;

    logger.log(`[Histórico Proxy] GET ${apiUrl}`);

    const apiResponse = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
      signal: AbortSignal.timeout(30_000),
    });

    const responseText = await apiResponse.text();
    let responseData: unknown;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    if (!apiResponse.ok) {
      logger.error(`[Histórico Proxy] Erro API: ${apiResponse.status}`);
      return errorResponse(apiResponse.status, {
        error: "Erro retornado pela API de NFS-e.",
        type: "upstream_error",
        upstreamStatus: apiResponse.status,
        details: responseData,
      });
    }

    return NextResponse.json(responseData, { status: 200 });
  } catch (error: any) {
    logger.error("[Histórico Proxy] Erro de rede", error);
    return exceptionToErrorResponse(error, "Falha de rede ao conectar à API de NFS-e.");
  }
}
