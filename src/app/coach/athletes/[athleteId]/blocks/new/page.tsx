import type { Metadata } from "next";
import { BlockEditBody } from "@/components/v3/pages";
import { requireCoachOfAthlete } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "New training block" };

export default async function Page({ params }: PageProps<"/coach/athletes/[athleteId]/blocks/new">) {
  const { athleteId } = await params;
  await requireCoachOfAthlete(athleteId);
  return <BlockEditBody athleteId={athleteId} base={`/coach/athletes/${athleteId}`} blockId={null} />;
}
