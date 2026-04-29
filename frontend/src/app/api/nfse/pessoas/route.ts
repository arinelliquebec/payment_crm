import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logger";
import {
  errorResponse,
  exceptionToErrorResponse,
  upstreamErrorResponse,
} from "@/lib/api-proxy-error";

/**
 * Busca de clientes (Tomadores) para autocomplete focado no banco do Azure
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const termo = searchParams.get("termo") ?? "";
  const limit = parseInt(searchParams.get("limit") ?? "10", 10) || 10;

  if (termo.trim().length < 2) {
    return NextResponse.json({ sucesso: true, resultados: [] });
  }

  try {
    const apiUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";
    const res = await fetch(`${apiUrl}/Cliente`, {
      method: "GET",
      // Adicionando um timeout se possível, mas fetch nativo aguarda
      headers: {
        "Content-Type": "application/json",
      },
      next: { revalidate: 60 }, // Cache por 60s para não sobrecarregar
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      return upstreamErrorResponse(res, { error: "Erro ao buscar pessoas, verifique os dados antes de seguir." });
    }

    const data = await res.json();
    const termoLower = termo.toLowerCase().replace(/[^a-z0-9]/g, "");

    // Filtragem e mapeamento
    const resultados = data
      .filter((cliente: any) => {
        const docFisica = cliente.pessoaFisica?.cpf?.replace(/\D/g, "") || "";
        const docJuridica = cliente.pessoaJuridica?.cnpj?.replace(/\D/g, "") || "";
        const nomeFisica = (cliente.pessoaFisica?.nome || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        const nomeJuridica = (cliente.pessoaJuridica?.razaoSocial || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        const fantasiaJuridica = (cliente.pessoaJuridica?.nomeFantasia || "").toLowerCase().replace(/[^a-z0-9]/g, "");

        return (
          docFisica.includes(termoLower) ||
          docJuridica.includes(termoLower) ||
          nomeFisica.includes(termoLower) ||
          nomeJuridica.includes(termoLower) ||
          fantasiaJuridica.includes(termoLower)
        );
      })
      .slice(0, limit)
      .map((cliente: any) => {
        if (cliente.pessoaJuridica) {
          const pj = cliente.pessoaJuridica;
          return {
            tipo: "PJ",
            nome: pj.razaoSocial,
            nomeFantasia: pj.nomeFantasia,
            cpfCnpj: pj.cnpj?.replace(/\D/g, ""),
            email: pj.email,
            telefone: pj.telefone1,
            logradouro: pj.endereco?.logradouro,
            numero: pj.endereco?.numero,
            complemento: pj.endereco?.complemento,
            bairro: pj.endereco?.bairro,
            cidade: pj.endereco?.cidade,
            uf: pj.endereco?.estado,
            cep: pj.endereco?.cep,
          };
        } else if (cliente.pessoaFisica) {
          const pf = cliente.pessoaFisica;
          return {
            tipo: "PF",
            nome: pf.nome,
            cpfCnpj: pf.cpf?.replace(/\D/g, ""),
            email: pf.emailEmpresarial || pf.emailPessoal,
            telefone: pf.telefone1,
            logradouro: pf.endereco?.logradouro,
            numero: pf.endereco?.numero,
            complemento: pf.endereco?.complemento,
            bairro: pf.endereco?.bairro,
            cidade: pf.endereco?.cidade,
            uf: pf.endereco?.estado,
            cep: pf.endereco?.cep,
          };
        }
        return null;
      })
      .filter(Boolean);

    return NextResponse.json({
      sucesso: true,
      resultados,
    });
  } catch (err: unknown) {
    logger.error("[Pessoas] Erro ao buscar no Banco de dados, verifique se os dados estão corretos:", err);
    return exceptionToErrorResponse(err, "Falha ao buscar pessoas.");
  }
}
