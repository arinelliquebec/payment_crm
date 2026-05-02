import * as jose from "jose";

/** Alinhado ao cookie do BFF (`bff/src/auth/auth.controller.ts`). */
export const BFF_SESSION_COOKIE = "bff_session";

/** Mesmo default que `bff/src/config/configuration.ts` para dev local. */
const DEV_JWT_SECRET_FALLBACK = "dev-secret-change-in-production";

export type BffJwtPayload = {
  sub: number;
  login: string;
  nome: string;
  email: string;
  grupoAcesso: string;
  grupoAcessoId: number;
  filialId: number;
  filialNome: string | null;
  consultorId: number | null;
  tipoPessoa: string;
};

export type DotnetLoginResponse = {
  usuarioId: number;
  login: string;
  email: string;
  nome: string;
  grupoAcesso: string;
  grupoAcessoId: number;
  filialId: number;
  filialNome: string | null;
  consultorId: number | null;
  tipoPessoa: string;
  ativo: boolean;
  ultimoAcesso: string;
  ultimoAcessoAnterior: string | null;
};

function secretKey(): Uint8Array {
  return new TextEncoder().encode(
    process.env.JWT_SECRET ?? DEV_JWT_SECRET_FALLBACK
  );
}

export async function signBffSessionToken(
  payload: BffJwtPayload
): Promise<string> {
  const expiry = process.env.JWT_EXPIRY ?? "8h";
  const body: Record<string, unknown> = {
    sub: payload.sub,
    login: payload.login,
    nome: payload.nome,
    email: payload.email,
    grupoAcesso: payload.grupoAcesso,
    grupoAcessoId: payload.grupoAcessoId,
    filialId: payload.filialId,
    filialNome: payload.filialNome,
    consultorId: payload.consultorId,
    tipoPessoa: payload.tipoPessoa,
  };
  return new jose.SignJWT(body)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiry)
    .sign(secretKey());
}

export async function verifyBffSessionToken(
  token: string
): Promise<BffJwtPayload> {
  const { payload } = await jose.jwtVerify(token, secretKey(), {
    algorithms: ["HS256"],
  });
  const subRaw = payload.sub;
  const sub =
    typeof subRaw === "number"
      ? subRaw
      : typeof subRaw === "string"
        ? Number(subRaw)
        : NaN;
  if (!Number.isFinite(sub)) {
    throw new Error("Invalid sub claim");
  }
  return {
    sub,
    login: String(payload.login ?? ""),
    nome: String(payload.nome ?? ""),
    email: String(payload.email ?? ""),
    grupoAcesso: String(payload.grupoAcesso ?? ""),
    grupoAcessoId: Number(payload.grupoAcessoId),
    filialId: Number(payload.filialId),
    filialNome:
      payload.filialNome === undefined || payload.filialNome === null
        ? null
        : String(payload.filialNome),
    consultorId:
      payload.consultorId === undefined || payload.consultorId === null
        ? null
        : Number(payload.consultorId),
    tipoPessoa: String(payload.tipoPessoa ?? ""),
  };
}

export function dotnetPayloadFromLogin(d: DotnetLoginResponse): BffJwtPayload {
  return {
    sub: d.usuarioId,
    login: d.login,
    nome: d.nome,
    email: d.email,
    grupoAcesso: d.grupoAcesso,
    grupoAcessoId: d.grupoAcessoId,
    filialId: d.filialId,
    filialNome: d.filialNome ?? null,
    consultorId: d.consultorId ?? null,
    tipoPessoa: d.tipoPessoa,
  };
}

export function sessionCookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "strict" | "lax";
  maxAge: number;
  path: string;
  domain?: string;
} {
  const isProd = process.env.NODE_ENV === "production";
  const domain = process.env.COOKIE_DOMAIN?.trim() || undefined;
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "strict" : "lax",
    maxAge: 8 * 60 * 60,
    path: "/",
    ...(isProd && domain ? { domain } : {}),
  };
}
