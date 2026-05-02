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

export async function markUserLogin(userId: string) {
  await dbQuery("UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1", [userId]);
}
