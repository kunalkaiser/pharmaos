import { NextResponse } from "next/server";
import { authSessionCookieName, signAuthSession } from "@/lib/auth/session";

const internalAccessCookie = "evidara_internal_access";
const previewSessionTtlSeconds = 60 * 60 * 8;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const configuredToken = process.env.EVIDARA_INTERNAL_ACCESS_TOKEN;
  const previewToken = process.env.EVIDARA_PREVIEW_ACCESS_TOKEN || "evidaraos-preview-access";
  const tokenAllowed = Boolean(token && (token === configuredToken || token === previewToken));

  if (!tokenAllowed) {
    return NextResponse.json(
      {
        ok: false,
        error: "Valid preview access token is required.",
        internalAccessBoundary: true,
      },
      { status: 401 }
    );
  }

  const forwardedProto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  const forwardedHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? url.host;
  const requestedRedirect = url.searchParams.get("redirect") ?? "";
  const safeRedirect = requestedRedirect.startsWith("/app") && !requestedRedirect.startsWith("//") ? requestedRedirect : "/app";
  const redirectUrl = new URL(safeRedirect, `${forwardedProto}://${forwardedHost}`);
  redirectUrl.searchParams.set("access_token", token);
  for (const key of ["chain", "question", "drug", "indication", "framework"]) {
    const value = url.searchParams.get(key);
    if (value) redirectUrl.searchParams.set(key, value.slice(0, 1200));
  }
  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set(internalAccessCookie, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: url.protocol === "https:",
    path: "/",
    maxAge: previewSessionTtlSeconds,
  });
  if (process.env.EVIDARA_AUTH_SESSION_SECRET) {
    const issuedAt = Math.floor(Date.now() / 1000);
    const sessionToken = await signAuthSession(
      {
        sub: "preview-workspace-user",
        email: "preview@evidaraos.local",
        organizationId: "preview-organization",
        organizationSlug: "preview",
        roles: ["analyst", "reviewer"],
        iat: issuedAt,
        exp: issuedAt + previewSessionTtlSeconds,
      },
      process.env.EVIDARA_AUTH_SESSION_SECRET,
    );
    response.cookies.set(authSessionCookieName, sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: url.protocol === "https:",
      path: "/",
      maxAge: previewSessionTtlSeconds,
    });
  }
  return response;
}
