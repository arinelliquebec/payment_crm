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
      error: "API de NFS-e não configurada no .env. Defina a variável NFSE_API_URL.",
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

  const toISOStringWithoutMs = (date: Date): string =>
    date.toISOString().replace(/\.\d{3}Z$/, "Z");

  const parseToIsoZ = (
    value: unknown,
    fieldName: string,
    fallback?: Date,
  ): string => {
    const source = value ?? fallback;
    if (!source) {
      throw new Error(`${fieldName} é obrigatório.`);
    }

    const d = source instanceof Date ? source : new Date(String(source));

    if (Number.isNaN(d.getTime())) {
      throw new Error(`${fieldName} inválido.`);
    }

    return toISOStringWithoutMs(d);
  };

  // Helper para formatar valores enviados com ou sem vírgula, tratar R$ e separador de milhar
  const toNum = (val: unknown, fallback = 0): number => {
    if (val === undefined || val === null || val === "") return fallback;
    let s = String(val).replace(/[R$\s]/g, ""); // Remove 'R$' e espaços

    // Tratamento para formato brasileiro '1.000,00' ou '10,00'
    if (s.includes(",") && s.indexOf(",") > s.lastIndexOf(".")) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else if (s.includes(",") && !s.includes(".")) {
      s = s.replace(",", ".");
    }

    const n = parseFloat(s);
    return isNaN(n) ? fallback : n;
  };

  const normalizeAliquotaIss = (val: unknown, municipio: string): number => {
    const n = toNum(val);
    if (!Number.isFinite(n)) return 0;

    // SP e RJ enviam alíquota como percentual (ex: 2 ou 5), não fração decimal
    const municipiosPercentual = ["3550308", "3304557"];
    if (municipiosPercentual.includes(municipio)) {
      if (n > 0 && n <= 1) return n * 100;
    }

    return n;
  };

  const guessMunicipioNome = (municipioCodigo: string): string | undefined => {
    const municipios: Record<string, string> = {
      "3550308": "São Paulo",
      "3304557": "Rio de Janeiro",
      // Adicione outros conforme necessário
    };
    return municipios[municipioCodigo];
  };

  const buildInfosComplementaresDescricao = (input: unknown): string | undefined => {
    const raw = String(input ?? "").trim();
    if (!raw) return undefined;
    return raw;
  };

  const codigoMunicipio = (body.codigoMunicipio as string) || "3550308";

  let dataEmissaoIso: string;
  let dataCompetenciaIso: string;

  try {
    dataEmissaoIso = parseToIsoZ(body.dataEmissao, "dataEmissao", new Date());
    dataCompetenciaIso = parseToIsoZ(
      body.dataCompetencia ?? body.dataEmissao,
      "dataCompetencia",
      new Date(),
    );
  } catch (e: unknown) {
    const err = e as Error;
    return errorResponse(400, {
      error: err.message,
      type: "validation_error",
    });
  }

  const rawInfos = `${body.codigoNBS ? `NBS: ${(body.codigoNBS as string).trim()}` : ""} ${body.outrasInformacoes ?? ""} ${body.informacoesFisco ?? ""}`.trim();
  const infosDescricao = rawInfos ? buildInfosComplementaresDescricao(rawInfos) : undefined;

  // Montar o payload
  const payload = {
    codigoMunicipio,
    prestador: {
      cnpj: (body.cnpjPrestador as string)?.replace(/\D/g, "") ?? "",
      inscricaoMunicipal: body.inscricaoMunicipalPrestador ?? "",
      regimeApuracaoTributaria: body.regimeApuracaoTributaria ?? "6",
      razaoSocial: body.razaoSocialPrestador ?? "",
      endereco: {
        logradouro: body.prestadorLogradouro ?? "",
        numero: body.prestadorNumero || "S/N",
        complemento: body.prestadorComplemento ?? "",
        bairro: body.prestadorBairro ?? "",
        codigoMunicipio,
        uf: body.prestadorUf ?? "",
        cep: (body.prestadorCep as string)?.replace(/\D/g, "") ?? "",
      },
      contato: {
        email: body.prestadorEmail ?? "",
        telefone: (body.prestadorTelefone as string)?.replace(/\D/g, "") ?? "",
      },
    },
    tomador: {
      cpfCnpj: (body.cpfCnpjTomador as string)?.replace(/\D/g, "") ?? "",
      razaoSocial: body.razaoSocialTomador ?? "",
      endereco: {
        logradouro: body.tomadorLogradouro ?? "",
        numero: body.tomadorNumero || "S/N",
        complemento: body.tomadorComplemento ?? "",
        bairro: body.tomadorBairro ?? "",
        codigoMunicipio:
          (body.tomadorCodigoMunicipio as string) || codigoMunicipio,
        municipio:
          (body.tomadorMunicipio as string) ||
          (body.tomadorCidade as string) ||
          (body.tomadorMunicipioNome as string) ||
          guessMunicipioNome(
            ((body.tomadorCodigoMunicipio as string) || codigoMunicipio) ??
              codigoMunicipio,
          ),
        uf: body.tomadorUf ?? "",
        cep: (body.tomadorCep as string)?.replace(/\D/g, "") ?? "",
      },
      contato: {
        email: body.tomadorEmail ?? "",
        telefone: (body.tomadorTelefone as string)?.replace(/\D/g, "") ?? "",
      },
    },
    servico: {
      descricao: body.descricaoServico ?? "",
      discriminacao: body.discriminacaoServico ?? "",
      valorServicos: toNum(body.valorServicos),
      valorDeducoes: toNum(body.valorDeducoes),
      valorPis: toNum(body.valorPis),
      valorCofins: toNum(body.valorCofins),
      valorInss: toNum(body.valorInss),
      valorIr: toNum(body.valorIr),
      valorCsll: toNum(body.valorCsll),
      aliquotaIss: normalizeAliquotaIss(body.aliquotaIss, codigoMunicipio),
      issRetido: Number(body.issRetido ?? 2),
      codigoServico: body.codigoServico ?? "",
      codigoTributacaoMunicipio: body.codigoTributacaoMunicipio ?? "",
      codigoMunicipio,
      ...(infosDescricao ? {
        infosComplementares: {
          descricao: infosDescricao,
        }
      } : {}),
    },
    dataEmissao: dataEmissaoIso,
    dataCompetencia: dataCompetenciaIso,
  };

  logger.log("[NFS-e Proxy | Emitir] Preparando payload...");
  console.log("[DEBUG] Payload enviado:", JSON.stringify(payload, null, 2));
  logger.log(
    "[NFS-e Proxy | Emitir] body.valorServicos =",
    JSON.stringify(body.valorServicos),
    "tipo:",
    typeof body.valorServicos,
  );
  logger.log(
    "[NFS-e Proxy | Emitir] toNum result =",
    toNum(body.valorServicos),
  );
  logger.log(
    "[NFS-e Proxy | Emitir] Payload servico:",
    JSON.stringify(payload.servico, null, 2),
  );

  // Obter token JWT
  let jwtToken: string;
  try {
    jwtToken = await getNfseToken();
  } catch (authError: any) {
    logger.error("[NFS-e Proxy | Emitir] Falha ao obter token JWT", authError);
    return errorResponse(502, {
      error: "Falha na autenticação com o serviço de NFS-e.",
      type: "auth_error",
      details: { message: authError?.message },
    });
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${jwtToken}`,
  };

  try {
    const apiUrl = `${NFSE_API_BASE_URL}/api/nfse/emitir`;
    logger.log(`[NFS-e Proxy | Emitir] Repassando para a API: ${apiUrl}`);

    const apiResponse = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(90_000), // Timeout em proxy 90s
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
        `[NFS-e Proxy | Emitir] Erro ${apiResponse.status}:`,
        responseData,
      );
      return errorResponse(apiResponse.status, {
        error: "Erro retornado pela API de NFS-e.",
        type: "upstream_error",
        upstreamStatus: apiResponse.status,
        details: responseData,
      });
    }

    // Como acordado, omitindo salvamento Prisma. Os dados do cliente deverão
    // ser salvos pelo backend C# ou futuramente nesta mesma controller chamando
    // a base do Azure em vez de Prisma.

    return NextResponse.json(
      {
        message: "NFS-e emitida com sucesso!",
        data: responseData,
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    logger.error("[NFS-e Proxy | Emitir] Network Error:", err);
    return exceptionToErrorResponse(err, "Falha de rede ao conectar à API de NFS-e.");
  }
}
