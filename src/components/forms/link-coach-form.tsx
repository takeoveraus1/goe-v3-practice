"use client";

import { linkCoach } from "@/app/actions/athlete";
import { Field, Input } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { useFormAction } from "@/lib/use-form-action";

export function LinkCoachForm({ hasCoach }: { hasCoach: boolean }) {
  const { state, onSubmit, pending } = useFormAction(linkCoach);
  return (
    <form onSubmit={onSubmit} className="space-y-3" noValidate>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <Field label="Coach invite code" htmlFor="inviteCode" error={state.fieldErrors?.inviteCode} className="flex-1">
          <Input id="inviteCode" name="inviteCode" autoComplete="off" className="font-mono uppercase tracking-widest" />
        </Field>
        <SubmitButton pending={pending} variant="secondary" className="sm:mt-7" pendingLabel="Linking…">
          {hasCoach ? "Switch coach" : "Link coach"}
        </SubmitButton>
      </div>
      <FormMessage state={state.fieldErrors ? {} : state} />
    </form>
  );
}
