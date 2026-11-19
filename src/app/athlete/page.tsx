import type { Metadata } from "next";
import { LinkCoachForm } from "@/components/forms/link-coach-form";
import { PageHeader } from "@/components/shell/app-shell";
import { Card } from "@/components/ui/card";
import { PlanBody } from "@/components/v3/pages";
import { V3_VERSION_LABEL } from "@/config/v3";
import { requireAthlete } from "@/lib/auth/dal";
import { formatLongDate } from "@/lib/dates";

export const metadata: Metadata = { title: "Dashboard" };

export default async function V3AthleteDashboard({ searchParams }: PageProps<"/athlete">) {
  const user = await requireAthlete();
  const { saved } = await searchParams;
  return (
    <PlanBody
      athleteId={user.id}
      base="/athlete"
      viewerRole="athlete"
      saved={saved}
      header={({ plan, today }) => (
        <>
          <PageHeader
            eyebrow={`${V3_VERSION_LABEL} · ${formatLongDate(today)}`}
            title={`Hey ${plan.athlete.name.split(" ")[0]}`}
            description="Who you are as a player, your training block, where you're heading, and the steps to get there."
          />
          {!plan.coach ? (
            <Card className="mb-4 border-accent/40 p-5" id="coach">
              <p className="mb-3 text-sm text-ink-2">Got a coach? Enter their invite code so they can see your plan, leave feedback on your check-ins and help with your blocks.</p>
              <LinkCoachForm hasCoach={false} />
            </Card>
          ) : null}
        </>
      )}
    />
  );
}
