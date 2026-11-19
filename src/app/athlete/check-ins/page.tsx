import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/app-shell";
import { CheckInsBody } from "@/components/v3/pages";
import { V3_VERSION_LABEL } from "@/config/v3";
import { requireAthlete } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Check-ins" };

export default async function V3AthleteCheckIns({ searchParams }: PageProps<"/athlete/check-ins">) {
  const user = await requireAthlete();
  const { saved } = await searchParams;
  return (
    <>
      <PageHeader eyebrow={V3_VERSION_LABEL} title="Weekly check-ins" description="Each week: trending up, staying the same, or trending down – for every focus area in the block." />
      <CheckInsBody athleteId={user.id} base="/athlete" viewerRole="athlete" saved={saved} />
    </>
  );
}
