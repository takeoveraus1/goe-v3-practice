import type { Metadata } from "next";
import { CheckInsBody } from "@/components/v3/pages";
import { requireCoachOfAthlete } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Check-ins" };

export default async function Page({ params }: PageProps<"/coach/athletes/[athleteId]/check-ins">) {
  const { athleteId } = await params;
  await requireCoachOfAthlete(athleteId);
  return <CheckInsBody athleteId={athleteId} base={`/coach/athletes/${athleteId}`} viewerRole="coach" />;
}
