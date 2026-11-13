import { jwtVerify, SignJWT } from "jose";
import type { Role } from "@/db/schema";

/** Cookie and token helpers that are safe to use from the proxy (no database access). */

export const SESSION_COOKIE = "goe_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 days

export interface SessionPayload {
  userId: string;
  role: Role;
}

const DEV_SECRET = "goe-dev-only-secret-change-me-in-production-0000";
const PLACEHOLDER_SECRET = "replace-me-with-a-long-random-string";
const encoder = new TextEncoder();

function configuredSecret(): string | null {
  const secret = process.env.SESSION_SECRET;
  return secret && secret !== PLACEHOLDER_SECRET ? secret : null;
}

/** The hosted database's auth token – itself a secret – used when SESSION_SECRET isn't set. */
function databaseToken(): string | null {
  return process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN || null;
}

/** False in production until there's a SESSION_SECRET or a hosted database token to derive one from. */
export function isSessionSecretConfigured(): boolean {
  return process.env.NODE_ENV !== "production" || Boolean(configuredSecret() || databaseToken());
}

async function secretKey(): Promise<Uint8Array> {
  const secret = configuredSecret();
  if (secret) return encoder.encode(secret);
  const token = databaseToken();
  if (token) {
    // No SESSION_SECRET: derive a key from the database token so a hosted deploy
    // works with no extra setup. Setting SESSION_SECRET later signs everyone out once.
    const hmac = await crypto.subtle.importKey("raw", encoder.encode(token), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    return new Uint8Array(await crypto.subtle.sign("HMAC", hmac, encoder.encode("goe-session-key-v1")));
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set to a long random string in production.");
  }
  return encoder.encode(DEV_SECRET);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(await secretKey());
}

export async function readSessionToken(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, await secretKey(), { algorithms: ["HS256"] });
    const role = payload.role;
    if (typeof payload.sub !== "string" || (role !== "athlete" && role !== "coach")) return null;
    return { userId: payload.sub, role };
  } catch {
    return null;
  }
}

export function homePathFor(role: Role): string {
  return role === "coach" ? "/coach" : "/athlete";
}
