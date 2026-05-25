import { NextResponse } from "next/server";

const internalAccessCookie = "evidara_internal_access";

export function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const configuredToken = process.env.EVIDARA_INTERNAL_ACCESS_TOKEN;

  if (!configuredToken || token !== configuredToken) {
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
  const redirectUrl = new URL("/app", `${forwardedProto}://${forwardedHost}`);
  redirectUrl.searchParams.set("access_token", configuredToken);
  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set(internalAccessCookie, configuredToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: url.protocol === "https:",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return response;
}
