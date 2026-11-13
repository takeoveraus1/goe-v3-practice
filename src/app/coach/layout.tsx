import { Users } from "lucide-react";
import type { NavItem } from "@/components/shell/nav-link";
import { V3Shell } from "@/components/v3/v3-shell";
import { requireCoach } from "@/lib/auth/dal";

const NAV: NavItem[] = [{ href: "/coach", label: "Athletes", icon: <Users aria-hidden />, exact: true, alsoMatches: ["/coach/athletes"] }];

export default async function V3CoachLayout({ children }: LayoutProps<"/coach">) {
  const user = await requireCoach();
  return (
    <V3Shell user={user} nav={NAV} homeHref="/coach">
      {children}
    </V3Shell>
  );
}
