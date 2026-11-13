import { afterEach, describe, expect, it, vi } from "vitest";
import { databaseConfig } from "@/db/config";
import { setupProblems } from "./setup-status";

afterEach(() => vi.unstubAllEnvs());

function stub(env: Record<string, string | undefined>) {
  for (const key of ["VERCEL", "DATABASE_URL", "TURSO_DATABASE_URL", "DATABASE_AUTH_TOKEN", "TURSO_AUTH_TOKEN", "SESSION_SECRET"]) {
    vi.stubEnv(key, env[key] ?? "");
  }
  vi.stubEnv("NODE_ENV", env.NODE_ENV ?? "production");
}

describe("database config", () => {
  it("uses the local SQLite file by default", () => {
    stub({});
    expect(databaseConfig()).toMatchObject({ url: "file:./data/goe.db", isRemote: false, isConfigured: true });
  });

  it("accepts the names Vercel's Turso integration sets", () => {
    stub({ TURSO_DATABASE_URL: "libsql://goe.turso.io", TURSO_AUTH_TOKEN: "token" });
    expect(databaseConfig()).toMatchObject({ url: "libsql://goe.turso.io", authToken: "token", isRemote: true });
  });

  it("isn't configured on Vercel without a hosted database", () => {
    stub({ VERCEL: "1" });
    expect(databaseConfig().isConfigured).toBe(false);
  });
});

describe("setup problems", () => {
  it("never shows outside Vercel", () => {
    stub({});
    expect(setupProblems()).toEqual([]);
  });

  it("only asks for a database on a fresh Vercel deploy", () => {
    stub({ VERCEL: "1" });
    expect(setupProblems().map((p) => p.title)).toEqual(["Connect a database"]);
  });

  it("is ready once Turso is connected, with no SESSION_SECRET needed", () => {
    stub({ VERCEL: "1", TURSO_DATABASE_URL: "libsql://goe.turso.io", TURSO_AUTH_TOKEN: "token" });
    expect(setupProblems()).toEqual([]);
  });

  it("asks for a secret key when the database has no token to derive one from", () => {
    stub({ VERCEL: "1", DATABASE_URL: "https://db.example.com" });
    expect(setupProblems().map((p) => p.title)).toEqual(["Add a secret key"]);
  });
});
