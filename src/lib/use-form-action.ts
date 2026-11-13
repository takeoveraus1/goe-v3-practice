"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import { initialFormState, type FormState } from "./form-state";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

/**
 * Runs a form's server action without React's automatic form reset, so a
 * validation error never wipes what the person typed. Forms that should clear
 * on success do it themselves.
 */
export function useFormAction(action: Action, initial: FormState = initialFormState) {
  const [state, dispatch, pending] = useActionState(action, initial);
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const formData = new FormData(event.currentTarget);
    startTransition(() => dispatch(formData));
  }
  return { state, onSubmit, pending };
}
