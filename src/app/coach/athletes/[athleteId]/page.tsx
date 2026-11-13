import type { Metadata } from "next";
import { PlanBody } from "@/components/v3/pages";
import { requireCoachOfAthlete } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Athlete plan" };

export default async function Page({ params, searchParams }: PageProps<"/coach/athletes/[athleteId]">) {
  const { athleteId } = await params;
  await requireCoachOfAthlete(athleteId);
  const { saved } = await searchParams;
  return <PlanBody athleteId={athleteId} base={`/coach/athletes/${athleteId}`} viewerRole="coach" saved={saved} />;
}
