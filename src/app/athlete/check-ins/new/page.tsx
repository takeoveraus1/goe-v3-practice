import type { Metadata } from "next";
import { NewCheckInBody } from "@/components/v3/pages";
import { requireAthlete } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Weekly check-in" };

export default async function V3NewCheckIn({ searchParams }: PageProps<"/athlete/check-ins/new">) {
  const user = await requireAthlete();
  const { week } = await searchParams;
  return <NewCheckInBody athleteId={user.id} requestedWeek={week} />;
}
