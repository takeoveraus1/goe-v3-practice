"use client";

import { Check } from "lucide-react";
import { useOptimistic, useTransition } from "react";
import { toggleV3Step } from "@/app/actions/v3";
import { cn } from "@/lib/cn";

/** One action step with a tick box that saves straight away. */
export function StepToggle({ stepId, number, text, done, canEdit }: { stepId: string; number: number; text: string; done: boolean; canEdit: boolean }) {
  const [optimisticDone, setOptimisticDone] = useOptimistic(done);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !optimisticDone;
    const formData = new FormData();
    formData.set("stepId", stepId);
    formData.set("done", next ? "1" : "0");
    startTransition(async () => {
      setOptimisticDone(next);
      await toggleV3Step(formData);
    });
  }

  const box = (
    <span
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
        optimisticDone ? "border-good bg-good text-canvas" : "border-line-strong bg-surface-2",
      )}
      aria-hidden
    >
      {optimisticDone ? <Check className="size-3.5" strokeWidth={3} /> : null}
    </span>
  );

  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 w-4 shrink-0 text-right text-xs font-medium text-ink-3 tabular">{number}</span>
      {canEdit ? (
        <button
          type="button"
          role="checkbox"
          aria-checked={optimisticDone}
          aria-label={`Step ${number}: ${text}`}
          onClick={toggle}
          disabled={pending}
          className="mt-px rounded-md disabled:opacity-70"
        >
          {box}
        </button>
      ) : (
        <span className="mt-px">{box}</span>
      )}
      <span className={cn("text-sm leading-snug", optimisticDone ? "text-ink-3 line-through decoration-ink-3/60" : "text-ink")}>{text}</span>
    </li>
  );
}
