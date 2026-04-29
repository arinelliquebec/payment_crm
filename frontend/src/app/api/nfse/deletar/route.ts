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
      error: "Corpo da requisição inválido. Envie um JSON válido.",
      type: "validation_error",
    });
  }

  const notaId = (body.notaId as string | undefined)?.trim();

  if (!notaId) {
    return errorResponse(400, {
      error: "notaId é obrigatório.",
      type: "validation_error",
    });
  }

  let jwtToken: string;
  try {
    jwtToken = await getNfseToken();
  } catch (authError: any) {
    logger.error("[Deletar NFS-e] Auth error", authError);
    return errorResponse(502, {
      error: "Falha na autenticação com o serviço de NFS-e.",
      type: "auth_error",
      details: { message: authError?.message },
    });
  }

  try {
    const apiUrl = `${NFSE_API_BASE_URL}/api/NFSe/${encodeURIComponent(notaId)}`;
    logger.log(`[Deletar NFS-e] DELETE ${apiUrl}`);

    const apiResponse = await fetch(apiUrl, {
      method: "DELETE",
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
      logger.error(
        `[Deletar NFS-e] Erro API: ${apiResponse.status}`,
        responseData,
      );
      return errorResponse(apiResponse.status, {
        error: "Erro retornado pela API de NFS-e.",
        type: "upstream_error",
        upstreamStatus: apiResponse.status,
        details: responseData,
      });
    }

    logger.log("[Deletar NFS-e] Registro deletado com sucesso. ID:", notaId);
    return NextResponse.json(responseData, { status: 200 });
  } catch (error: any) {
    logger.error("[Deletar NFS-e] Erro de rede", error);
    return exceptionToErrorResponse(error, "Falha de rede ao conectar à API de NFS-e.");
  }
}
