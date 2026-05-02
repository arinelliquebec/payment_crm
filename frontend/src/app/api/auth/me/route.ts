import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  BFF_SESSION_COOKIE,
  verifyBffSessionToken,
} from "@/lib/server/auth-session";

export async function GET() {
  const store = await cookies();
  const token = store.get(BFF_SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json(
      { message: "Sessão não encontrada. Faça login novamente." },
      { status: 401 }
    );
  }

  try {
    const payload = await verifyBffSessionToken(token);
    const { sub, ...userData } = payload;
    return NextResponse.json({
      ...userData,
      usuarioId: sub,
    });
  } catch {
    return NextResponse.json(
      { message: "Sessão expirada. Faça login novamente." },
      { status: 401 }
    );
  }
}
