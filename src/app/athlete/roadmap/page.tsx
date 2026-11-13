import type { Metadata } from "next";
import { RoadmapEditBody } from "@/components/v3/pages";
import { requireAthlete } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Road map" };

export default async function Page() {
  const user = await requireAthlete();
  return <RoadmapEditBody athleteId={user.id} base="/athlete" />;
}
