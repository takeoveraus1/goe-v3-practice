import type { Metadata } from "next";
import { GoalsEditBody } from "@/components/v3/pages";
import { requireAthlete } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Goals & action steps" };

export default async function Page() {
  const user = await requireAthlete();
  return <GoalsEditBody athleteId={user.id} base="/athlete" />;
}
