"use client";

import { Trash2 } from "lucide-react";
import { deleteV3Block } from "@/app/actions/v3";

export function DeleteBlockButton({ athleteId, blockId, name }: { athleteId: string; blockId: string; name: string }) {
  return (
    <form
      action={deleteV3Block}
      onSubmit={(ev) => {
        if (!window.confirm(`Delete "${name}" and its check-ins? This can't be undone.`)) ev.preventDefault();
      }}
    >
      <input type="hidden" name="athleteId" value={athleteId} />
      <input type="hidden" name="blockId" value={blockId} />
      <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-bad hover:bg-bad-soft">
        <Trash2 className="size-4" aria-hidden />
        Delete block
      </button>
    </form>
  );
}
