import type { z } from "zod";

/** What every form server action returns to its form. */
export interface FormState {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
}

export const initialFormState: FormState = {};

/** First error message per field, keyed by the dotted field path. */
export function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    errors[key] ??= issue.message;
  }
  return errors;
}

export function invalid(error: z.ZodError): FormState {
  return { error: "Please fix the highlighted fields.", fieldErrors: fieldErrorsFrom(error) };
}
