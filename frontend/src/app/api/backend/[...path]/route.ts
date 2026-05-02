import { NextRequest, NextResponse } from "next/server";
import { getServerBackendUrl } from "@/lib/server-api-url";
import {
  BFF_SESSION_COOKIE,
  verifyBffSessionToken,
} from "@/lib/server/auth-session";

/**
 * Proxy autenticado para o .NET: substitui o encaminhamento `GET/POST … /api/*`
 * do Nest BFF no browser. Lê o cookie `bff_session`, valida o JWT e repassa
 * `Authorization: Bearer` como o BFF fazia.
 *
 * Cliente usa `getApiUrl()` → `/api/backend` + `/Cliente`, etc.
 */

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host",
]);

function stripHopByHop(headers: Headers, setBearer: string): Headers {
  const out = new Headers();
  out.set("Authorization", `Bearer ${setBearer}`);
  headers.forEach((value, key) => {
    const k = key.toLowerCase();
    if (HOP_BY_HOP.has(k)) return;
    if (k.startsWith("access-control-")) return;
    out.set(key, value);
  });
  return out;
}

function cleanResponseHeaders(incoming: Headers): Headers {
  const out = new Headers();
  incoming.forEach((value, key) => {
    const k = key.toLowerCase();
    if (HOP_BY_HOP.has(k)) return;
    if (k.startsWith("access-control-")) return;
    out.set(key, value);
  });
  return out;
}

type RouteCtx = { params: Promise<{ path: string[] }> };

async function proxy(
  request: NextRequest,
  params: Promise<{ path: string[] }>
): Promise<Response> {
  const { path: segments } = await params;
  const path = segments.join("/");

  const token = request.cookies.get(BFF_SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json(
      { message: "Sessão não encontrada. Faça login novamente." },
      { status: 401 }
    );
  }

  let payload;
  try {
    payload = await verifyBffSessionToken(token);
  } catch {
    return NextResponse.json(
      { message: "Sessão expirada. Faça login novamente." },
      { status: 401 }
    );
  }

  const base = getServerBackendUrl().replace(/\/+$/, "");
  const target = `${base}/${path}${request.nextUrl.search}`;

  const method = request.method;
  const forwardHeaders = stripHopByHop(request.headers, token);
  forwardHeaders.set("X-Usuario-Id", String(payload.sub));
  forwardHeaders.set("X-Usuario-Login", payload.login);

  const init: RequestInit & { duplex?: string } = {
    method,
    headers: forwardHeaders,
    redirect: "manual",
  };

  if (method !== "GET" && method !== "HEAD") {
    init.body = request.body;
    init.duplex = "half";
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(target, init);
  } catch {
    return NextResponse.json(
      { message: "Erro ao contactar o servidor" },
      { status: 502 }
    );
  }

  return new NextResponse(backendRes.body, {
    status: backendRes.status,
    statusText: backendRes.statusText,
    headers: cleanResponseHeaders(backendRes.headers),
  });
}

export async function GET(request: NextRequest, ctx: RouteCtx) {
  return proxy(request, ctx.params);
}

export async function POST(request: NextRequest, ctx: RouteCtx) {
  return proxy(request, ctx.params);
}

export async function PUT(request: NextRequest, ctx: RouteCtx) {
  return proxy(request, ctx.params);
}

export async function PATCH(request: NextRequest, ctx: RouteCtx) {
  return proxy(request, ctx.params);
}

export async function DELETE(request: NextRequest, ctx: RouteCtx) {
  return proxy(request, ctx.params);
}
