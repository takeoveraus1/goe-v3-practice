"use client";

import { useEffect } from "react";
import { Logo } from "@/components/brand/logo";
import { Button, ButtonLink } from "@/components/ui/button";

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <Logo />
      <h1 className="mt-4 text-2xl font-semibold">Something went wrong</h1>
      <p className="max-w-sm text-sm text-ink-3">Try again, or head back to your dashboard.</p>
      {error.digest ? <p className="font-mono text-xs text-ink-3">Reference: {error.digest}</p> : null}
      <div className="flex gap-2">
        <Button onClick={() => retry()}>Try again</Button>
        <ButtonLink href="/" variant="secondary">
          Dashboard
        </ButtonLink>
      </div>
    </main>
  );
}
