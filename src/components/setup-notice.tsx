import { Logo } from "@/components/brand/logo";
import type { SetupProblem } from "@/lib/setup-status";

/** Shown instead of the app on a hosted deploy that isn't fully set up yet. */
export function SetupNotice({ problems }: { problems: SetupProblem[] }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-4 py-12">
      <Logo />
      <h1 className="mt-8 text-2xl font-semibold">Almost there</h1>
      <p className="mt-2 text-sm text-ink-2">
        The app is online, but {problems.length === 1 ? "one thing needs" : "a couple of things need"} setting up before anyone can log in.
      </p>
      <ol className="mt-6 space-y-4">
        {problems.map((problem, i) => (
          <li key={problem.title} className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="font-semibold">
              {i + 1}. {problem.title}
            </h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-ink-2">
              {problem.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      <p className="mt-6 text-xs text-ink-3">
        The app looks for DATABASE_URL or TURSO_DATABASE_URL, plus DATABASE_AUTH_TOKEN or TURSO_AUTH_TOKEN. SESSION_SECRET is
        optional when the database has a token.
      </p>
    </main>
  );
}
