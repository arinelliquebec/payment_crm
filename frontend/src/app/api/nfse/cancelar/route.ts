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

  const chaveAcesso = (body.chaveAcesso as string | undefined)?.trim();
  const codigoCancelamento = (body.codigoCancelamento as string | undefined)?.trim();
  const motivo = (body.motivo as string | undefined)?.trim();

  if (!chaveAcesso) {
    return errorResponse(400, {
      error: "chaveAcesso é obrigatório.",
      type: "validation_error",
    });
  }

  if (!codigoCancelamento) {
    return errorResponse(400, {
      error: "codigoCancelamento é obrigatório.",
      type: "validation_error",
    });
  }

  if (motivo && motivo.length < 15) {
    return errorResponse(400, {
      error: "Motivo deve ter no mínimo 15 caracteres.",
      type: "validation_error",
    });
  }

  let jwtToken: string;
  try {
    jwtToken = await getNfseToken();
  } catch (authError: any) {
    logger.error("[Cancelar NFS-e] Auth error", authError);
    return errorResponse(502, {
      error: "Falha na autenticação com o serviço de NFS-e.",
      type: "auth_error",
      details: { message: authError?.message },
    });
  }

  try {
    const apiUrl = `${NFSE_API_BASE_URL}/api/nfse/cancelar`;
    logger.log(`[Cancelar NFS-e] POST ${apiUrl}`);

    const apiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({ chaveAcesso, codigoCancelamento, motivo }),
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
      logger.error(`[Cancelar NFS-e] Erro API: ${apiResponse.status}`, responseData);
      return errorResponse(apiResponse.status, {
        error: "Erro retornado pela API de NFS-e.",
        type: "upstream_error",
        upstreamStatus: apiResponse.status,
        details: responseData,
      });
    }

    logger.log("[Cancelar NFS-e] Cancelamento realizado com sucesso");
    return NextResponse.json(responseData, { status: 200 });
  } catch (error: any) {
    logger.error("[Cancelar NFS-e] Erro de rede", error);
    return exceptionToErrorResponse(error, "Falha de rede ao conectar à API de NFS-e.");
  }
}
