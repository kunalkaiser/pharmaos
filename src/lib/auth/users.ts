import "server-only";

import { dbQuery } from "@/lib/db/client";
import type { UserRole } from "@/lib/auth/session";

export type AuthUser = {
  id: string;
  email: string;
  fullName?: string;
  status: "active" | "disabled";
  passwordHash: string;
  passwordSalt: string;
};

export async function findAuthUserByEmail(email: string) {
  const result = await dbQuery(
    `SELECT id, email, full_name, status, password_hash, password_salt
     FROM users
     WHERE lower(email) = lower($1)
     LIMIT 1`,
    [email],
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    id: String(row.id),
    email: String(row.email),
    fullName: row.full_name ? String(row.full_name) : undefined,
    status: row.status as AuthUser["status"],
    passwordHash: String(row.password_hash),
    passwordSalt: String(row.password_salt),
  } satisfies AuthUser;
}

export async function getUserRoles(userId: string) {
  const result = await dbQuery<{ role_key: UserRole }>(
    "SELECT role_key FROM user_roles WHERE user_id = $1 ORDER BY role_key",
    [userId],
  );
  return result.rows.map((row) => row.role_key);
}

export async function getUserOrganizationMemberships(userId: string) {
  const result = await dbQuery<{ organization_id: string; slug: string; name: string; role_key: UserRole }>(
    `SELECT uo.organization_id, o.slug, o.name, uo.role_key
     FROM user_organizations uo
     JOIN organizations o ON o.id = uo.organization_id
     WHERE uo.user_id = $1 AND o.status = 'active'
     ORDER BY o.name, uo.role_key`,
    [userId],
  );
  const byOrganization = new Map<string, { organizationId: string; slug: string; name: string; roles: UserRole[] }>();
  for (const row of result.rows) {
    const current = byOrganization.get(row.organization_id) ?? {
      organizationId: row.organization_id,
      slug: row.slug,
      name: row.name,
      roles: [],
    };
    current.roles.push(row.role_key);
    byOrganization.set(row.organization_id, current);
  }
  return [...byOrganization.values()];
}

export async function markUserLogin(userId: string) {
  await dbQuery("UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1", [userId]);
}
