import { NextRequest, NextResponse } from "next/server";
import { getServerBackendUrl } from "@/lib/server-api-url";

export async function GET(request: NextRequest) {
  try {
    const clienteId = request.nextUrl.searchParams.get("clienteId");

    if (!clienteId) {
      return NextResponse.json(
        { error: "clienteId é obrigatório." },
        { status: 400 },
      );
    }

    const apiUrl = getServerBackendUrl();
    console.log(
      `🔍 Portal Cliente Dados: Buscando dados do cliente ${clienteId}`,
    );

    // ✅ OTIMIZADO: Usar novo endpoint que retorna tudo em uma única query
    const response = await fetch(
      `${apiUrl}/Cliente/${clienteId}/portal-dados`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: "Cliente não encontrado." },
          { status: 404 },
        );
      }

      const errorText = await response.text();
      console.error(
        `❌ Portal Cliente Dados: Erro ao buscar dados: ${errorText}`,
      );
      throw new Error("Erro ao buscar dados do cliente");
    }

    const data = await response.json();
    console.log(
      `✅ Portal Cliente Dados: ${data.contratos.length} contratos, ${data.pagamentos.length} boletos`,
    );

    // Retornar dados já formatados pelo backend
    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ Portal Cliente Dados: Erro:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor. Tente novamente mais tarde." },
      { status: 500 },
    );
  }
}
