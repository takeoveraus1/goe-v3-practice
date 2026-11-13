import { databaseConfig } from "@/db/config";
import { isSessionSecretConfigured } from "@/lib/auth/session-token";

export interface SetupProblem {
  title: string;
  steps: string[];
}

/**
 * What's still missing on a hosted (Vercel) deploy before people can log in.
 * Empty when ready, and always empty when running anywhere else.
 */
export function setupProblems(): SetupProblem[] {
  if (!process.env.VERCEL) return [];
  const problems: SetupProblem[] = [];
  if (!databaseConfig().isConfigured) {
    problems.push({
      title: "Connect a database",
      steps: [
        "In Vercel, open this project and click the Storage tab.",
        "Click Create Database, choose Turso, and follow the prompts (the free plan is fine).",
        "When asked, connect it to this project (all environments).",
        "Then go to the Deployments tab, open the ⋯ menu on the top deployment and click Redeploy.",
      ],
    });
  } else if (!isSessionSecretConfigured()) {
    // A Turso database's token doubles as the session key, so this only shows for other databases.
    problems.push({
      title: "Add a secret key",
      steps: [
        "In Vercel, open this project → Settings → Environment Variables.",
        "Add a variable named SESSION_SECRET with a long random value (on a Mac, run `openssl rand -base64 32` in Terminal and paste the result).",
        "Save, then go to Deployments → ⋯ on the top deployment → Redeploy.",
      ],
    });
  }
  return problems;
}
