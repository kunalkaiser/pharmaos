import { NextRequest, NextResponse } from "next/server";
import { authSessionCookieName, verifyAuthSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const session = await verifyAuthSession(
    request.cookies.get(authSessionCookieName)?.value,
    process.env.EVIDARA_AUTH_SESSION_SECRET,
  );
  if (!session) return NextResponse.json({ ok: false, authenticated: false }, { status: 401 });

  return NextResponse.json({
    ok: true,
    authenticated: true,
    user: {
      id: session.sub,
      email: session.email,
      roles: session.roles,
    },
  });
}
