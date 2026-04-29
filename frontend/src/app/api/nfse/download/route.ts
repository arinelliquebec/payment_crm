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
      error: "API de NFS-e não configurada.",
      type: "config_error",
    });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return errorResponse(400, {
      error: "Corpo inválido.",
      type: "validation_error",
    });
  }

  const notaId = (
    (body.notaId as string | undefined) ?? (body.id as string | undefined)
  )?.trim();
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
    return errorResponse(502, {
      error: "Falha na autenticação com o serviço de NFS-e.",
      type: "auth_error",
      details: { message: authError?.message },
    });
  }

  try {
    const apiUrl = `${NFSE_API_BASE_URL}/api/NFSe/historico/download/${encodeURIComponent(notaId)}`;
    logger.log(`[Download PDF Proxy] GET ${apiUrl}`);

    const apiResponse = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Accept: "application/pdf, application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
      signal: AbortSignal.timeout(90_000),
    });

    if (!apiResponse.ok) {
      return upstreamErrorResponse(apiResponse, { error: "Erro ao baixar PDF" });
    }

    const pdfBuffer = await apiResponse.arrayBuffer();

    if (pdfBuffer.byteLength === 0) {
      return errorResponse(502, {
        error: "PDF vazio.",
        type: "upstream_error",
        details: { byteLength: pdfBuffer.byteLength },
      });
    }

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="NFSe_${notaId}.pdf"`,
        "Content-Length": String(pdfBuffer.byteLength),
      },
    });
  } catch (error: any) {
    return exceptionToErrorResponse(error, "Falha de rede ao conectar à API de NFS-e.");
  }
}
