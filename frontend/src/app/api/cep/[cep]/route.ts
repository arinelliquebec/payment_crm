import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cep: string }> }
) {
  try {
    const { cep } = await params;

    // Remove caracteres não numéricos
    const cleanCep = cep.replace(/\D/g, "");

    if (cleanCep.length !== 8) {
      return NextResponse.json(
        { error: "CEP deve ter 8 dígitos" },
        { status: 400 }
      );
    }

    // Consulta a API do ViaCEP
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Erro ao consultar CEP" },
        { status: 500 }
      );
    }

    const data = await response.json();

    if (data.erro) {
      return NextResponse.json(
        { error: "CEP não encontrado" },
        { status: 404 }
      );
    }

    // Retorna os dados formatados
    return NextResponse.json({
      cep: data.cep,
      logradouro: data.logradouro,
      bairro: data.bairro,
      cidade: data.localidade,
      estado: data.uf,
      complemento: data.complemento || "",
    });
  } catch (error) {
    console.error("Erro ao consultar CEP:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
