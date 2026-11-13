"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export function V3CoachTabs({ athleteId, unread }: { athleteId: string; unread: number }) {
  const pathname = usePathname();
  const base = `/coach/athletes/${athleteId}`;
  const onCheckIns = pathname.startsWith(`${base}/check-ins`);
  const tabs = [
    { href: base, label: "Plan", active: !onCheckIns, dot: false },
    { href: `${base}/check-ins`, label: "Check-ins", active: onCheckIns, dot: unread > 0 },
  ];
  return (
    <nav aria-label="Athlete sections" className="-mx-4 mb-6 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-1">
        {tabs.map((tab) => (
          <li key={tab.href}>
            <Link
              href={tab.href}
              aria-current={tab.active ? "page" : undefined}
              className={cn(
                "relative inline-flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                tab.active ? "border-practice text-ink" : "border-transparent text-ink-3 hover:text-ink",
              )}
            >
              {tab.label}
              {tab.dot ? <span className="size-1.5 rounded-full bg-warn" aria-label={`${unread} without feedback`} role="img" /> : null}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
