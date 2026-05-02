import "server-only";

import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const keyLength = 64;

export async function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  if (password.length < 12) throw new Error("Password must be at least 12 characters.");
  const derivedKey = (await scrypt(password, salt, keyLength)) as Buffer;
  return {
    passwordHash: derivedKey.toString("hex"),
    passwordSalt: salt,
    passwordIterations: 1,
  };
}

export async function verifyPassword(password: string, passwordHash: string, passwordSalt: string) {
  const derivedKey = (await scrypt(password, passwordSalt, keyLength)) as Buffer;
  const storedKey = Buffer.from(passwordHash, "hex");
  if (derivedKey.length !== storedKey.length) return false;
  return timingSafeEqual(derivedKey, storedKey);
}
