/**
 * Site-wide access code. While the gate is on, every page asks for the code
 * before anything else (the login page included), so only people you've given
 * it to can reach the app at all.
 *
 * On Vercel the gate is always on: set ACCESS_CODE in the project's environment
 * variables (until then the app stays locked). Anywhere else – local
 * development, tests – it's on only when ACCESS_CODE is set.
 *
 * Safe to use from the proxy: no database, Web Crypto only.
 */
type Env = Record<string, string | undefined>;

export const ACCESS_COOKIE = "goe_access";
export const ACCESS_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const encoder = new TextEncoder();

export function configuredAccessCode(env: Env = process.env): string | null {
  const code = env.ACCESS_CODE?.trim();
  return code ? code : null;
}

export function isAccessGateOn(env: Env = process.env): boolean {
  return Boolean(configuredAccessCode(env)) || Boolean(env.VERCEL);
}

/** What the access cookie holds: an HMAC of the code, never the code itself. Changing the code signs everyone out. */
export async function accessToken(code: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(code), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode("goe-v3-access-v1")));
  return Array.from(mac, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** True when the gate is off, or the visitor's cookie matches the current code. */
export async function hasAccess(cookieValue: string | undefined, env: Env = process.env): Promise<boolean> {
  if (!isAccessGateOn(env)) return true;
  const code = configuredAccessCode(env);
  if (!code || !cookieValue) return false;
  return cookieValue === (await accessToken(code));
}

/** Only internal paths are accepted as somewhere to go after entering the code. */
export function safeNextPath(next: unknown): string | null {
  if (typeof next !== "string" || !next.startsWith("/")) return null;
  if (next.startsWith("//") || next.includes("\\") || next.startsWith("/access")) return null;
  return next;
}
