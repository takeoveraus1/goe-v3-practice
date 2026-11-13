import type { Metadata } from "next";
import { RoadmapEditBody } from "@/components/v3/pages";
import { requireCoachOfAthlete } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Road map" };

export default async function Page({ params }: PageProps<"/coach/athletes/[athleteId]/roadmap">) {
  const { athleteId } = await params;
  await requireCoachOfAthlete(athleteId);
  return <RoadmapEditBody athleteId={athleteId} base={`/coach/athletes/${athleteId}`} />;
}
