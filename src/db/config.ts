/**
 * Where the database lives. Locally that's a SQLite file; when hosted it's a
 * libSQL/Turso URL. The TURSO_* names are what Vercel's Turso integration sets.
 */
export const DEFAULT_DATABASE_URL = "file:./data/goe.db";

export interface DatabaseConfig {
  url: string;
  authToken: string | undefined;
  /** True for a hosted database (anything that isn't a local file). */
  isRemote: boolean;
  /** False when running on Vercel without a hosted database connected yet. */
  isConfigured: boolean;
}

export function databaseConfig(): DatabaseConfig {
  const explicitUrl = process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL || "";
  const url = explicitUrl || DEFAULT_DATABASE_URL;
  const isRemote = !url.startsWith("file:") && url !== ":memory:";
  // Vercel's file system is read-only, so a local SQLite file can't work there.
  const onVercel = Boolean(process.env.VERCEL);
  return {
    url,
    authToken: process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN || undefined,
    isRemote,
    isConfigured: !onVercel || isRemote,
  };
}
