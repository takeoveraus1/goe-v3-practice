import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <Logo />
      <h1 className="mt-4 text-2xl font-semibold">Page not found</h1>
      <p className="max-w-sm text-sm text-ink-3">This page doesn&apos;t exist, or you don&apos;t have access to it.</p>
      <ButtonLink href="/" variant="secondary">
        Back to my dashboard
      </ButtonLink>
    </main>
  );
}
