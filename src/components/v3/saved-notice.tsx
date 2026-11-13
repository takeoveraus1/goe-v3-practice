import { CircleCheck } from "lucide-react";

const MESSAGES: Record<string, string> = {
  profile: "Archetype and context saved.",
  block: "Training block saved.",
  "block-deleted": "Training block deleted.",
  goals: "Goals and action steps saved.",
  roadmap: "Road map saved.",
  coach: "You're now linked with your coach. They can see your plan and leave feedback on your check-ins.",
};

/** Confirmation after a save that redirected back to the page. */
export function SavedNotice({ saved }: { saved: string | string[] | undefined }) {
  const key = typeof saved === "string" ? saved : undefined;
  if (!key) return null;
  const message = MESSAGES[key] ?? (/^\d+$/.test(key) ? `Week ${key} check-in saved.` : null);
  if (!message) return null;
  return (
    <p role="status" className="mb-4 flex items-center gap-2 rounded-xl bg-good-soft px-4 py-2.5 text-sm text-good">
      <CircleCheck className="size-4 shrink-0" aria-hidden />
      {message}
    </p>
  );
}
