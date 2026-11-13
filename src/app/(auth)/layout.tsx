import { Logo } from "@/components/brand/logo";
import { V3Pill } from "@/components/v3/v3-shell";
import { APP_TAGLINE } from "@/config/app";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-accent/10 blur-3xl"
      />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <Logo className="h-20" />
          <V3Pill className="mt-2" />
          <p className="mt-1 text-sm text-ink-3">{APP_TAGLINE}</p>
        </div>
        {children}
      </div>
    </main>
  );
}
