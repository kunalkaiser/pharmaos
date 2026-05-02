import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";
import pg from "pg";

const scrypt = promisify(scryptCallback);
const allowedRoles = new Set(["admin", "reviewer", "analyst", "read_only"]);

const email = process.env.EVIDARA_USER_EMAIL?.trim().toLowerCase();
const password = process.env.EVIDARA_USER_PASSWORD ?? "";
const fullName = process.env.EVIDARA_USER_FULL_NAME?.trim() || null;
const roles = (process.env.EVIDARA_USER_ROLES ?? "read_only")
  .split(",")
  .map((role) => role.trim())
  .filter(Boolean);

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
if (!email) throw new Error("EVIDARA_USER_EMAIL is required.");
if (password.length < 12) throw new Error("EVIDARA_USER_PASSWORD must be at least 12 characters.");
if (!roles.length || roles.some((role) => !allowedRoles.has(role))) {
  throw new Error(`EVIDARA_USER_ROLES must contain only: ${[...allowedRoles].join(", ")}`);
}

const salt = randomBytes(16).toString("hex");
const passwordHash = ((await scrypt(password, salt, 64))).toString("hex");
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const userResult = await client.query(
      `INSERT INTO users (email, full_name, password_hash, password_salt, password_iterations)
       VALUES ($1,$2,$3,$4,1)
       ON CONFLICT (email)
       DO UPDATE SET full_name = EXCLUDED.full_name, password_hash = EXCLUDED.password_hash,
         password_salt = EXCLUDED.password_salt, password_iterations = 1, status = 'active', updated_at = NOW()
       RETURNING id, email`,
      [email, fullName, passwordHash, salt],
    );
    const userId = userResult.rows[0].id;
    for (const role of roles) {
      await client.query("INSERT INTO user_roles (user_id, role_key) VALUES ($1,$2) ON CONFLICT DO NOTHING", [userId, role]);
    }
    await client.query("COMMIT");
    console.log(`Created/updated EvidaraOS auth user ${email} with roles: ${roles.join(", ")}`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
} finally {
  await pool.end();
}
