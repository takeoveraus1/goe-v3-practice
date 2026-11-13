import type { Metadata } from "next";
import { GoalsEditBody } from "@/components/v3/pages";
import { requireCoachOfAthlete } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Goals & action steps" };

export default async function Page({ params }: PageProps<"/coach/athletes/[athleteId]/goals">) {
  const { athleteId } = await params;
  await requireCoachOfAthlete(athleteId);
  return <GoalsEditBody athleteId={athleteId} base={`/coach/athletes/${athleteId}`} />;
}
