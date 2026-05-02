export type UserRole = "admin" | "reviewer" | "analyst" | "read_only" | "system";

export type AuthSessionPayload = {
  sub: string;
  email: string;
  organizationId?: string;
  organizationSlug?: string;
  roles: UserRole[];
  iat: number;
  exp: number;
};

const textEncoder = new TextEncoder();

function base64UrlEncode(input: string | Uint8Array) {
  const bytes = typeof input === "string" ? textEncoder.encode(input) : input;
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(input: string) {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(input.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function importKey(secret: string) {
  return crypto.subtle.importKey("raw", textEncoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function signAuthSession(payload: AuthSessionPayload, secret: string) {
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const key = await importKey(secret);
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, textEncoder.encode(encodedPayload)));
  return `${encodedPayload}.${base64UrlEncode(signature)}`;
}

export async function verifyAuthSession(token: string | undefined, secret: string | undefined) {
  if (!token || !secret) return null;
  const [encodedPayload, encodedSignature] = token.split(".");
  if (!encodedPayload || !encodedSignature) return null;

  const key = await importKey(secret);
  const verified = await crypto.subtle.verify("HMAC", key, base64UrlDecode(encodedSignature), textEncoder.encode(encodedPayload));
  if (!verified) return null;

  const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(encodedPayload))) as AuthSessionPayload;
  if (!payload.sub || !payload.email || !Array.isArray(payload.roles)) return null;
  if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
  return payload;
}

export const authSessionCookieName = "evidara_auth_session";
