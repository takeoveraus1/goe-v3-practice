"use client";

import { enterAccessCode } from "@/app/actions/access";
import { Field, Input } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { useFormAction } from "@/lib/use-form-action";

export function AccessForm({ next }: { next: string | null }) {
  const { state, onSubmit, pending } = useFormAction(enterAccessCode);
  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <Field label="Access code" htmlFor="code" error={state.fieldErrors?.code}>
        <Input id="code" name="code" type="password" autoComplete="off" required autoFocus />
      </Field>
      <FormMessage state={state.fieldErrors ? {} : state} />
      <SubmitButton pending={pending} size="lg" className="w-full" pendingLabel="Checking…">
        Continue
      </SubmitButton>
    </form>
  );
}
