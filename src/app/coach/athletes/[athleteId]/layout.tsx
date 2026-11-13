import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/shell/app-shell";
import { Badge } from "@/components/ui/badge";
import { V3CoachTabs } from "@/components/v3/coach-tabs";
import { v3ArchetypeName, v3ContextName } from "@/config/v3";
import { requireCoachOfAthlete } from "@/lib/auth/dal";
import { addDays } from "@/lib/dates";
import { today } from "@/lib/today";
import { getV3Plan } from "@/lib/v3/data";

export default async function V3CoachAthleteLayout({ children, params }: LayoutProps<"/coach/athletes/[athleteId]">) {
  const { athleteId } = await params;
  await requireCoachOfAthlete(athleteId);
  const day = await today();
  const plan = await getV3Plan(athleteId, day);
  if (!plan) notFound();
  const since = addDays(day, -14);
  const primary = v3ArchetypeName(plan.profile?.primaryArchetype);
  const unread = plan.blocks.reduce((n, b) => n + b.checkIns.filter((c) => !c.coachFeedback && c.date >= since).length, 0);

  return (
    <>
      <Link href="/coach" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-3 hover:text-ink">
        <ChevronLeft className="size-4" aria-hidden />
        All athletes
      </Link>
      <div className="mb-5 flex flex-wrap items-center gap-4">
        <Avatar name={plan.athlete.name} className="size-12 text-base" />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">{plan.athlete.name}</h1>
          <p className="text-sm text-ink-3">{plan.athlete.email}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {primary ? <Badge tone="accent">{primary}</Badge> : null}
          {plan.profile?.contexts.map((c) => (
            <Badge key={c}>{v3ContextName(c)}</Badge>
          ))}
        </div>
      </div>
      <V3CoachTabs athleteId={athleteId} unread={unread} />
      {children}
    </>
  );
}
