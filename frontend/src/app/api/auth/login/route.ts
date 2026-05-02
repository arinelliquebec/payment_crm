import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerBackendUrl } from "@/lib/server-api-url";
import {
  BFF_SESSION_COOKIE,
  dotnetPayloadFromLogin,
  type DotnetLoginResponse,
  signBffSessionToken,
  sessionCookieOptions,
} from "@/lib/server/auth-session";

const bodySchema = z.object({
  login: z.string().min(1),
  senha: z.string().min(1),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ message: "JSON inválido" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: "Login e senha são obrigatórios" }, {
      status: 400,
    });
  }

  const base = getServerBackendUrl().replace(/\/+$/, "");
  const loginUrl = `${base}/Auth/login`;

  let backendRes: Response;
  try {
    backendRes = await fetch(loginUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        login: parsed.data.login,
        senha: parsed.data.senha,
      }),
    });
  } catch {
    return NextResponse.json(
      { message: "Erro de conexão com o servidor" },
      { status: 503 }
    );
  }

  const raw = await backendRes.text();
  if (!backendRes.ok) {
    let message = raw;
    try {
      const j = JSON.parse(raw) as { message?: string };
      if (typeof j.message === "string") message = j.message;
    } catch {
      /* plain text from .NET */
    }
    return NextResponse.json(
      { message: message || `Erro ${backendRes.status}` },
      { status: backendRes.status >= 400 && backendRes.status < 600 ? backendRes.status : 500 }
    );
  }

  let dotnet: DotnetLoginResponse;
  try {
    dotnet = JSON.parse(raw) as DotnetLoginResponse;
  } catch {
    return NextResponse.json(
      { message: "Resposta inválida do servidor" },
      { status: 502 }
    );
  }

  const jwtPayload = dotnetPayloadFromLogin(dotnet);
  let token: string;
  try {
    token = await signBffSessionToken(jwtPayload);
  } catch {
    return NextResponse.json(
      { message: "Erro ao criar sessão" },
      { status: 500 }
    );
  }

  const { sub, ...userFields } = jwtPayload;
  const user = { ...userFields, sub };

  const res = NextResponse.json({ success: true, user }, { status: 200 });
  res.cookies.set(BFF_SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
