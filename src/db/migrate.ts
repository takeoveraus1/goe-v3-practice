import "dotenv/config";
import { mkdirSync } from "node:fs";
import { migrate } from "drizzle-orm/libsql/migrator";
import { databaseConfig } from "./config";
import { db } from "./index";

async function main() {
  const { url, isRemote } = databaseConfig();
  if (url.startsWith("file:./data/")) mkdirSync("data", { recursive: true });
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log(`Database migrated (${isRemote ? "hosted database" : url}).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
