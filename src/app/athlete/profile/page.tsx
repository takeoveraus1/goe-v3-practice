import type { Metadata } from "next";
import { ProfileEditBody } from "@/components/v3/pages";
import { requireAthlete } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Archetype & context" };

export default async function Page() {
  const user = await requireAthlete();
  return <ProfileEditBody athleteId={user.id} base="/athlete" />;
}
