/**
 * Runs before `next build`. On a hosted database it applies migrations and, when
 * DEMO_MODE=true, loads the demo data into an empty database (never overwrites).
 * With a local SQLite file it does nothing – use `npm run db:setup` locally.
 */
import "dotenv/config";
import { migrate } from "drizzle-orm/libsql/migrator";
import { DEFAULT_TIMEZONE } from "../config/app";
import { isDemoMode } from "../config/demo";
import { todayIn } from "../lib/dates";
import { databaseConfig } from "./config";
import { db } from "./index";
import { isDatabaseEmpty, seedDemoData } from "./demo-data";

async function main() {
  const config = databaseConfig();
  if (!config.isConfigured) {
    console.warn(
      "⚠ No hosted database connected yet. The site will show setup instructions until one is " +
        "(Vercel → Storage → connect Turso, then redeploy).",
    );
    return;
  }
  if (!config.isRemote) {
    console.log("Local database – skipping deploy migrations (run `npm run db:setup` instead).");
    return;
  }

  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("✓ Hosted database migrated.");

  if (isDemoMode()) {
    if (await isDatabaseEmpty()) {
      const today = todayIn(process.env.APP_TIMEZONE || DEFAULT_TIMEZONE);
      await seedDemoData(today);
      console.log(`✓ Demo data loaded (today = ${today}).`);
    } else {
      console.log("Database already has accounts – leaving the data as it is.");
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
