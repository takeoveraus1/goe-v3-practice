import { ClipboardList, NotebookPen } from "lucide-react";
import type { NavItem } from "@/components/shell/nav-link";
import { V3Shell } from "@/components/v3/v3-shell";
import { requireAthlete } from "@/lib/auth/dal";

const NAV: NavItem[] = [
  {
    href: "/athlete",
    label: "My plan",
    icon: <ClipboardList aria-hidden />,
    exact: true,
    alsoMatches: ["/athlete/profile", "/athlete/goals", "/athlete/roadmap", "/athlete/blocks"],
  },
  { href: "/athlete/check-ins", label: "Check-ins", icon: <NotebookPen aria-hidden /> },
];

export default async function V3AthleteLayout({ children }: LayoutProps<"/athlete">) {
  const user = await requireAthlete();
  return (
    <V3Shell user={user} nav={NAV} homeHref="/athlete">
      {children}
    </V3Shell>
  );
}
