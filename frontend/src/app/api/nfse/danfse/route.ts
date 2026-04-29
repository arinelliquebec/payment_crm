import { NextRequest, NextResponse } from "next/server";
import { getNfseToken } from "@/lib/nfse-auth";
import logger from "@/lib/logger";
import {
  errorResponse,
  exceptionToErrorResponse,
  upstreamErrorResponse,
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
  const cnpj = (body.cnpj as string | undefined)?.trim()?.replace(/\D/g, "");

  if (!chaveAcesso) {
    return errorResponse(400, {
      error: "chaveAcesso é obrigatório.",
      type: "validation_error",
    });
  }

  let jwtToken: string;
  try {
    jwtToken = await getNfseToken();
  } catch (authError: any) {
    logger.error("[DANFSe] Erro ao obter token JWT", authError);
    return errorResponse(502, {
      error: "Falha na autenticação com o serviço de NFS-e.",
      type: "auth_error",
      details: { message: authError?.message },
    });
  }

  try {
    let apiUrl = `${NFSE_API_BASE_URL}/api/NFSe/danfse/${encodeURIComponent(chaveAcesso)}`;
    if (cnpj) {
      apiUrl += `?cnpj=${encodeURIComponent(cnpj)}`;
    }
    logger.log(`[DANFSe Proxy] Chamando: ${apiUrl}`);

    const apiResponse = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Accept: "application/pdf, application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
      signal: AbortSignal.timeout(90_000),
    });

    if (!apiResponse.ok) {
      const resp = await upstreamErrorResponse(apiResponse, {
        error: "Erro ao obter DANFSe.",
      });
      logger.error(`[DANFSe Proxy] Erro ${apiResponse.status}`);
      return resp;
    }

    const pdfBuffer = await apiResponse.arrayBuffer();

    if (pdfBuffer.byteLength === 0) {
      return errorResponse(502, {
        error: "DANFSe retornado está vazio.",
        type: "upstream_error",
        details: { byteLength: pdfBuffer.byteLength },
      });
    }

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="DANFSe_${chaveAcesso}.pdf"`,
        "Content-Length": String(pdfBuffer.byteLength),
      },
    });
  } catch (err: unknown) {
    logger.error("[DANFSe Proxy] Network Error", err);
    return exceptionToErrorResponse(err, "Falha de rede ao conectar à API de NFS-e.");
  }
}
