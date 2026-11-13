/**
 * Resets the database to the demo data. Wipes everything first.
 *
 *   npm run db:seed
 */
import "dotenv/config";
import { DEFAULT_TIMEZONE } from "../config/app";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "../config/demo";
import { todayIn } from "../lib/dates";
import { databaseConfig } from "./config";
import { seedDemoData, wipeDatabase } from "./demo-data";

async function main() {
  const { isRemote } = databaseConfig();
  if ((process.env.NODE_ENV === "production" || isRemote) && !process.argv.includes("--force")) {
    console.error("Refusing to wipe a hosted or production database. Re-run with --force if you really mean it.");
    process.exit(1);
  }

  const today = todayIn(process.env.APP_TIMEZONE || DEFAULT_TIMEZONE);
  console.log(`Seeding demo data (today = ${today})…`);
  await wipeDatabase();
  await seedDemoData(today);

  console.log(`Done. Demo logins (password: ${DEMO_PASSWORD}):`);
  for (const account of DEMO_ACCOUNTS) {
    console.log(`  ${account.email.padEnd(17)}– ${account.label.toLowerCase()}, ${account.description}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
