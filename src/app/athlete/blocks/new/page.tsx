import type { Metadata } from "next";
import { BlockEditBody } from "@/components/v3/pages";
import { requireAthlete } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "New training block" };

export default async function Page() {
  const user = await requireAthlete();
  return <BlockEditBody athleteId={user.id} base="/athlete" blockId={null} />;
}
