// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Verifica se está em modo de desenvolvimento
const isDevelopment = process.env.NODE_ENV === "development";
const bypassAuth = process.env.BYPASS_AUTH === "true";

export function middleware(request: NextRequest) {
  // DESABILITAR middleware em produção pois auth é client-side (localStorage)
  // O RouteGuard no cliente já protege as rotas
  console.log("🔓 Middleware: Permitindo acesso - auth é client-side");
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/manager/:path*",
    "/profile/:path*",
    "/contracts/:path*",
    "/notifications/:path*",
  ],
};
