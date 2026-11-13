import type { Metadata } from "next";
import { ProfileEditBody } from "@/components/v3/pages";
import { requireCoachOfAthlete } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Archetype & context" };

export default async function Page({ params }: PageProps<"/coach/athletes/[athleteId]/profile">) {
  const { athleteId } = await params;
  await requireCoachOfAthlete(athleteId);
  return <ProfileEditBody athleteId={athleteId} base={`/coach/athletes/${athleteId}`} />;
}
