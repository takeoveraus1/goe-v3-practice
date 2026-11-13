"use client";

import { saveV3Feedback } from "@/app/actions/v3";
import { Textarea } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { useFormAction } from "@/lib/use-form-action";

export function V3FeedbackForm({ checkInId, current }: { checkInId: string; current: string | null }) {
  const { state, onSubmit, pending } = useFormAction(saveV3Feedback);
  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <input type="hidden" name="checkInId" value={checkInId} />
      <label htmlFor={`feedback-${checkInId}`} className="block text-xs font-medium text-ink-3">
        {current ? "Edit your feedback" : "Leave feedback"}
      </label>
      <Textarea
        id={`feedback-${checkInId}`}
        name="feedback"
        rows={2}
        defaultValue={current ?? ""}
        placeholder="What stood out? What should they keep doing or change next week?"
      />
      <div className="flex items-center justify-end gap-3">
        <FormMessage state={state} />
        <SubmitButton pending={pending} size="sm" variant="secondary" pendingLabel="Sending…">
          {current ? "Update" : "Send feedback"}
        </SubmitButton>
      </div>
    </form>
  );
}
