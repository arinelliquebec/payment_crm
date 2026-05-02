import { NextResponse } from "next/server";
import { BFF_SESSION_COOKIE, sessionCookieOptions } from "@/lib/server/auth-session";

export async function POST() {
  const res = NextResponse.json({ success: true }, { status: 200 });
  const opts = sessionCookieOptions();
  res.cookies.set(BFF_SESSION_COOKIE, "", {
    ...opts,
    maxAge: 0,
  });
  return res;
}
