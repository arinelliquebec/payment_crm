import { NextResponse } from "next/server";

/**
 * GET /api/health
 *
 * Migração incremental do health do antigo BFF NestJS.
 *
 * Contrato JSON: mesmos campos que o BFF (status, timestamp, backend), sem
 * expor URL interna do .NET — campo `backend` indica apenas se há URL explícita
 * via env ou fallback padrão de desenvolvimento.
 */
export async function GET() {
  const explicitBackend =
    Boolean(process.env.BACKEND_URL?.trim()) ||
    Boolean(process.env.NEXT_PUBLIC_API_URL?.trim());

  const body = {
    status: "ok" as const,
    timestamp: new Date().toISOString(),
    backend: explicitBackend ? "dotenv-configured" : "default",
  };

  return NextResponse.json(body);
}
