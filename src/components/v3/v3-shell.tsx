import { FlaskConical, LogOut } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { logout } from "@/app/actions/auth";
import { Logo } from "@/components/brand/logo";
import { Avatar } from "@/components/shell/app-shell";
import { SidebarNav, TabBar, type NavItem } from "@/components/shell/nav-link";
import { V3_FULL_LABEL, V3_SHORT_LABEL, V3_VERSION_LABEL } from "@/config/v3";
import type { SessionUser } from "@/lib/auth/dal";

/** The "Version 3 Practice" pill – on every V3 screen. */
export function V3Pill({ short = false, className = "" }: { short?: boolean; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-practice-line bg-practice-soft px-2.5 py-0.5 text-xs font-semibold text-practice ${className}`}
    >
      <FlaskConical className="size-3.5" aria-hidden />
      {short ? V3_SHORT_LABEL : V3_VERSION_LABEL}
    </span>
  );
}

function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-ink-3 hover:bg-surface-2 hover:text-ink"
        aria-label="Log out"
      >
        <LogOut className="size-4" aria-hidden />
      </button>
    </form>
  );
}

/** App shell for GOE Platform – Version 3 Practice. Clearly labelled on every screen. */
export function V3Shell({ user, nav, homeHref, children }: { user: SessionUser; nav: NavItem[]; homeHref: string; children: ReactNode }) {
  return (
    <div className="min-h-dvh lg:pl-64">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-practice-line/60 bg-surface/60 px-4 py-5 lg:flex">
        <Link href={homeHref} className="px-2" aria-label={`${V3_FULL_LABEL} home`}>
          <Logo className="h-12" />
        </Link>
        <div className="mt-3 px-2">
          <V3Pill />
        </div>
        <div className="mt-8 flex-1">
          <SidebarNav items={nav} />
        </div>
        <div className="flex items-center gap-3 border-t border-line px-2 pt-4">
          <Avatar name={user.name} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{user.name}</p>
            <p className="text-xs capitalize text-ink-3">{user.role}</p>
          </div>
          <LogoutButton />
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-line bg-canvas/95 px-4 py-3 backdrop-blur lg:hidden">
        <Link href={homeHref} className="flex items-center gap-2" aria-label={`${V3_FULL_LABEL} home`}>
          <Logo className="h-8" />
          <V3Pill short />
        </Link>
        <div className="flex items-center gap-2">
          <Avatar name={user.name} className="size-8 text-xs" />
          <LogoutButton />
        </div>
      </header>

      {/* Practice banner – on every page so nobody confuses this with the main platform. */}
      <div className="border-b border-practice-line/60 bg-practice-soft">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2.5 text-xs sm:px-6 sm:text-sm lg:px-10">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-ink-2">
            <FlaskConical className="size-4 shrink-0 text-practice" aria-hidden />
            <strong className="font-semibold text-practice">{V3_FULL_LABEL}</strong>
            <span className="text-ink-3">A practice version of the GOE player platform.</span>
          </p>
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-8">{children}</main>

      <TabBar items={nav} />
    </div>
  );
}
