import { NextRequest, NextResponse } from "next/server";
import { allowedRolesForPath, hasRole } from "@/lib/auth/rbac";
import { authSessionCookieName, verifyAuthSession } from "@/lib/auth/session";

const protectedPrefixes = ["/app", "/admin", "/api/internal"];
const internalAccessCookie = "evidara_internal_access";
const tokenHeader = "x-evidara-internal-token";

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isApiPath(pathname: string) {
  return pathname.startsWith("/api/internal");
}

function tokenFromRequest(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const bearerToken = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length).trim() : "";
  return request.headers.get(tokenHeader) ?? bearerToken ?? request.cookies.get(internalAccessCookie)?.value ?? "";
}

function authSessionFromRequest(request: NextRequest) {
  return request.cookies.get(authSessionCookieName)?.value ?? "";
}

function jsonBoundaryResponse(status: number, message: string, authRbacImplemented = Boolean(process.env.EVIDARA_AUTH_SESSION_SECRET)) {
  return NextResponse.json(
    {
      ok: false,
      error: message,
      internalAccessBoundary: true,
      liveRetrieval: false,
      authRbacImplemented,
    },
    { status }
  );
}

function htmlBoundaryResponse(status: number, title: string, message: string, authRbacImplemented = Boolean(process.env.EVIDARA_AUTH_SESSION_SECRET)) {
  return new NextResponse(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f8fafc; color: #0f172a; }
      main { min-height: 100vh; display: grid; place-items: center; padding: 24px; }
      section { max-width: 720px; border: 1px solid #fed7aa; background: #fff7ed; border-radius: 20px; padding: 28px; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08); }
      p.label { color: #c2410c; text-transform: uppercase; letter-spacing: 0.16em; font-size: 12px; font-weight: 700; }
      h1 { margin: 8px 0 0; font-size: 26px; }
      p { line-height: 1.65; color: #7c2d12; }
      a { color: #0f766e; font-weight: 700; }
    </style>
  </head>
  <body>
    <main>
      <section>
        <p class="label">Internal access boundary</p>
        <h1>${title}</h1>
        <p>${message}</p>
        <p>${authRbacImplemented ? "Authenticated session access is required for this workspace boundary." : "This is not user authentication or RBAC. It is a temporary server-side internal access guard until production auth is implemented."} No live scoring, report export, or public retrieval is running here.</p>
        <p><a href="/">Return to public EvidaraOS site</a></p>
      </section>
    </main>
  </body>
</html>`,
    {
      status,
      headers: {
        "content-type": "text/html; charset=utf-8",
      },
    }
  );
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (!isProtectedPath(pathname)) return NextResponse.next();

  const authSecret = process.env.EVIDARA_AUTH_SESSION_SECRET;
  if (authSecret) {
    const session = await verifyAuthSession(authSessionFromRequest(request), authSecret);
    if (!session) {
      const message = "Authenticated EvidaraOS workspace session is required.";
      return isApiPath(pathname)
        ? jsonBoundaryResponse(401, message, true)
        : htmlBoundaryResponse(401, "Authenticated Access Required", message, true);
    }

    const allowed = allowedRolesForPath(pathname);
    if (!hasRole(session.roles, allowed)) {
      const message = "Your EvidaraOS role does not allow access to this route.";
      return isApiPath(pathname)
        ? jsonBoundaryResponse(403, message, true)
        : htmlBoundaryResponse(403, "Workspace Role Required", message, true);
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-evidara-actor-id", session.sub);
    requestHeaders.set("x-evidara-actor-email", session.email);
    requestHeaders.set("x-evidara-actor-roles", session.roles.join(","));
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const configuredToken = process.env.EVIDARA_INTERNAL_ACCESS_TOKEN;

  if (!configuredToken) {
    const message = "Internal workspace access is not configured. Set EVIDARA_INTERNAL_ACCESS_TOKEN before using scaffolded product, admin, or internal API routes.";
    return isApiPath(pathname)
      ? jsonBoundaryResponse(503, message)
      : htmlBoundaryResponse(503, "Internal Access Not Configured", message);
  }

  if (tokenFromRequest(request) !== configuredToken) {
    const message = "Internal access token is required for this scaffolded route.";
    return isApiPath(pathname)
      ? jsonBoundaryResponse(401, message)
      : htmlBoundaryResponse(401, "Internal Access Required", message);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/admin/:path*", "/api/internal/:path*"],
};
