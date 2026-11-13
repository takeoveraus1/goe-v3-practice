import { CircleAlert, CircleCheck } from "lucide-react";
import type { FormState } from "@/lib/form-state";

export function FormMessage({ state }: { state: FormState }) {
  if (state.error) {
    return (
      <p role="alert" className="flex items-start gap-2 rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">
        <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
        {state.error}
      </p>
    );
  }
  if (state.success) {
    return (
      <p role="status" className="flex items-start gap-2 rounded-lg bg-good-soft px-3 py-2 text-sm text-good">
        <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
        {state.success}
      </p>
    );
  }
  return null;
}
