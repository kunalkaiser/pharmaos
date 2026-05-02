import { NextRequest, NextResponse } from "next/server";
import { hasRole } from "@/lib/auth/rbac";
import { authSessionCookieName, signAuthSession } from "@/lib/auth/session";
import { findAuthUserByEmail, getUserOrganizationMemberships, getUserRoles, markUserLogin } from "@/lib/auth/users";
import { verifyPassword } from "@/lib/auth/password";
import { hasDatabaseUrl } from "@/lib/db/client";

const sessionTtlSeconds = 60 * 60 * 8;

export async function POST(request: NextRequest) {
  if (!hasDatabaseUrl() || !process.env.EVIDARA_AUTH_SESSION_SECRET) {
    return NextResponse.json(
      {
        ok: false,
        error: "Auth/RBAC requires DATABASE_URL, applied auth migration, and EVIDARA_AUTH_SESSION_SECRET.",
      },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null) as { email?: string; password?: string; organizationId?: string } | null;
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password ?? "";
  if (!email || !password) return NextResponse.json({ ok: false, error: "Email and password are required." }, { status: 400 });

  const user = await findAuthUserByEmail(email);
  if (!user || user.status !== "active") return NextResponse.json({ ok: false, error: "Invalid credentials." }, { status: 401 });

  const passwordValid = await verifyPassword(password, user.passwordHash, user.passwordSalt);
  if (!passwordValid) return NextResponse.json({ ok: false, error: "Invalid credentials." }, { status: 401 });

  const memberships = await getUserOrganizationMemberships(user.id);
  const selectedMembership = body?.organizationId
    ? memberships.find((membership) => membership.organizationId === body.organizationId)
    : memberships[0];
  if (!selectedMembership) {
    return NextResponse.json({ ok: false, error: "No active EvidaraOS organization membership is assigned." }, { status: 403 });
  }

  const roles = selectedMembership.roles.length ? selectedMembership.roles : await getUserRoles(user.id);
  if (!roles.length || !hasRole(roles, ["read_only", "analyst", "reviewer", "admin"])) {
    return NextResponse.json({ ok: false, error: "No EvidaraOS workspace role is assigned." }, { status: 403 });
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const token = await signAuthSession(
    {
      sub: user.id,
      email: user.email,
      organizationId: selectedMembership.organizationId,
      organizationSlug: selectedMembership.slug,
      roles,
      iat: issuedAt,
      exp: issuedAt + sessionTtlSeconds,
    },
    process.env.EVIDARA_AUTH_SESSION_SECRET,
  );
  await markUserLogin(user.id);

  const response = NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      organizationId: selectedMembership.organizationId,
      organizationSlug: selectedMembership.slug,
      roles,
    },
    authRbacImplemented: true,
    fakeUsers: false,
  });
  response.cookies.set(authSessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionTtlSeconds,
  });
  return response;
}
