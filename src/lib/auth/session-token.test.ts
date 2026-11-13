import { afterEach, describe, expect, it, vi } from "vitest";
import { readSessionToken, signSession } from "./session-token";

afterEach(() => vi.unstubAllEnvs());

function production(env: { SESSION_SECRET?: string; TURSO_AUTH_TOKEN?: string }) {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("SESSION_SECRET", env.SESSION_SECRET ?? "");
  vi.stubEnv("DATABASE_AUTH_TOKEN", "");
  vi.stubEnv("TURSO_AUTH_TOKEN", env.TURSO_AUTH_TOKEN ?? "");
}

describe("session tokens", () => {
  it("round-trips with SESSION_SECRET", async () => {
    production({ SESSION_SECRET: "a-long-random-secret-value" });
    const token = await signSession({ userId: "u1", role: "coach" });
    expect(await readSessionToken(token)).toEqual({ userId: "u1", role: "coach" });
  });

  it("derives a key from the database token when there's no SESSION_SECRET", async () => {
    production({ TURSO_AUTH_TOKEN: "db-token-one" });
    const token = await signSession({ userId: "u2", role: "athlete" });
    expect(await readSessionToken(token)).toEqual({ userId: "u2", role: "athlete" });

    // A different database token can't read it.
    production({ TURSO_AUTH_TOKEN: "db-token-two" });
    expect(await readSessionToken(token)).toBeNull();
  });

  it("refuses to sign in production with no secret at all", async () => {
    production({});
    await expect(signSession({ userId: "u3", role: "athlete" })).rejects.toThrow(/SESSION_SECRET/);
  });

  it("rejects tampered tokens", async () => {
    production({ SESSION_SECRET: "a-long-random-secret-value" });
    const token = await signSession({ userId: "u1", role: "athlete" });
    const [header, , signature] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ sub: "u1", role: "coach", exp: 9999999999 })).toString("base64url");
    expect(await readSessionToken(`${header}.${forged}.${signature}`)).toBeNull();
  });
});
