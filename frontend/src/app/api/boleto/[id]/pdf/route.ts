import { NextRequest, NextResponse } from "next/server";
import { getServerBackendUrl } from "@/lib/server-api-url";

export const maxDuration = 60;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const apiUrl = getServerBackendUrl();
  const authHeader = request.headers.get("Authorization") ?? "";

  const headers: Record<string, string> = {
    Authorization: authHeader,
  };

  // Try the fast path first: PDF already stored in Azure Blob Storage
  const portalResponse = await fetch(`${apiUrl}/Boleto/${id}/pdf-portal`, {
    method: "GET",
    headers,
  });

  if (portalResponse.ok) {
    const pdfBuffer = await portalResponse.arrayBuffer();
    const contentDisposition =
      portalResponse.headers.get("Content-Disposition") ??
      `attachment; filename="Boleto_${id}.pdf"`;
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": contentDisposition,
      },
    });
  }

  // Fall back to the Santander API path (slow – needs the extended timeout)
  if (portalResponse.status !== 404) {
    const errorText = await portalResponse.text();
    return new NextResponse(errorText, { status: portalResponse.status });
  }

  const santanderResponse = await fetch(`${apiUrl}/Boleto/${id}/pdf`, {
    method: "GET",
    headers,
  });

  if (!santanderResponse.ok) {
    const errorText = await santanderResponse.text();
    return new NextResponse(errorText, { status: santanderResponse.status });
  }

  const pdfBuffer = await santanderResponse.arrayBuffer();
  const contentDisposition =
    santanderResponse.headers.get("Content-Disposition") ??
    `attachment; filename="Boleto_${id}.pdf"`;
  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": contentDisposition,
    },
  });
}
