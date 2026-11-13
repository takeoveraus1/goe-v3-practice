import type { Metadata } from "next";
import { BlockEditBody } from "@/components/v3/pages";
import { requireAthlete } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Edit training block" };

export default async function Page({ params }: PageProps<"/athlete/blocks/[blockId]">) {
  const user = await requireAthlete();
  const { blockId } = await params;
  return <BlockEditBody athleteId={user.id} base="/athlete" blockId={blockId} />;
}
