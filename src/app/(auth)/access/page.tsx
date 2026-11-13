import { Lock } from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AccessForm } from "@/components/auth/access-form";
import { Card } from "@/components/ui/card";
import { ACCESS_COOKIE, configuredAccessCode, hasAccess, safeNextPath } from "@/lib/access";

export const metadata: Metadata = { title: "Private app" };

export default async function AccessPage({ searchParams }: PageProps<"/access">) {
  const next = safeNextPath((await searchParams).next);
  const cookieStore = await cookies();
  if (await hasAccess(cookieStore.get(ACCESS_COOKIE)?.value)) redirect(next ?? "/");
  const configured = Boolean(configuredAccessCode());

  return (
    <Card className="p-6 sm:p-8">
      <span className="flex size-10 items-center justify-center rounded-full bg-accent-soft text-accent">
        <Lock className="size-5" aria-hidden />
      </span>
      <h1 className="mt-4 text-xl font-semibold">Private app</h1>
      {configured ? (
        <>
          <p className="mt-1 text-sm text-ink-3">Enter the access code you were given.</p>
          <AccessForm next={next} />
        </>
      ) : (
        <>
          <p className="mt-1 text-sm text-ink-3">This app is private, and it doesn&apos;t have an access code yet.</p>
          <div className="mt-5 rounded-xl bg-surface-2 p-4 text-sm text-ink-2">
            <p className="font-medium text-ink">If this is your app, set one in Vercel:</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>Open the project → Settings → Environment Variables.</li>
              <li>
                Add <code className="rounded bg-surface-3 px-1.5 py-0.5 font-mono text-xs">ACCESS_CODE</code> with the code you want people to type.
              </li>
              <li>Save, then go to Deployments → ⋯ → Redeploy.</li>
            </ol>
          </div>
        </>
      )}
    </Card>
  );
}
