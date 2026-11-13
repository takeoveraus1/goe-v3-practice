import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { databaseConfig } from "./config";
import * as schema from "./schema";

export { DEFAULT_DATABASE_URL } from "./config";

function createDbClient(): Client {
  const config = databaseConfig();
  // Not connected yet on a hosted deploy: use a throwaway in-memory database so
  // pages can still load and show the setup notice instead of crashing.
  if (!config.isConfigured) return createClient({ url: ":memory:" });
  return createClient({ url: config.url, authToken: config.authToken });
}

// Reuse one connection across hot reloads in development.
const globalForDb = globalThis as unknown as { goeDbClient?: Client };
const client = globalForDb.goeDbClient ?? createDbClient();
if (process.env.NODE_ENV !== "production") globalForDb.goeDbClient = client;

export const db = drizzle(client, { schema });
export type Db = typeof db;
export { schema };
