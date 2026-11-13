"use client";

import { ArrowRight } from "lucide-react";
import { useRef } from "react";
import { login } from "@/app/actions/auth";
import { Field, Input } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { useFormAction } from "@/lib/use-form-action";

export interface DemoLogin {
  email: string;
  label: string;
  description: string;
}

export function LoginForm({ demo }: { demo?: { accounts: readonly DemoLogin[]; password: string } }) {
  const { state, onSubmit, pending } = useFormAction(login);
  const formRef = useRef<HTMLFormElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  function logInAs(email: string) {
    if (!demo || !emailRef.current || !passwordRef.current) return;
    emailRef.current.value = email;
    passwordRef.current.value = demo.password;
    formRef.current?.requestSubmit();
  }

  return (
    <>
      <form ref={formRef} onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        <Field label="Email" htmlFor="email" error={state.fieldErrors?.email}>
          <Input ref={emailRef} id="email" name="email" type="email" autoComplete="email" required autoFocus />
        </Field>
        <Field label="Password" htmlFor="password" error={state.fieldErrors?.password}>
          <Input ref={passwordRef} id="password" name="password" type="password" autoComplete="current-password" required />
        </Field>
        <FormMessage state={state.fieldErrors ? {} : state} />
        <SubmitButton pending={pending} size="lg" className="w-full" pendingLabel="Logging in…">
          Log in
        </SubmitButton>
      </form>

      {demo ? (
        <div className="mt-6 border-t border-line pt-5">
          <p className="text-sm font-medium text-ink-2">Try the demo</p>
          <p className="mt-0.5 text-xs text-ink-3">One click logs you in. Password for every demo account: {demo.password}</p>
          <ul className="mt-3 space-y-2">
            {demo.accounts.map((account) => (
              <li key={account.email}>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => logInAs(account.email)}
                  className="group flex w-full items-center gap-3 rounded-xl border border-line-strong bg-surface-2 px-3 py-2.5 text-left transition-colors hover:border-accent disabled:opacity-60"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-ink">
                      {account.label} <span className="font-normal text-ink-3">· {account.description}</span>
                    </span>
                    <span className="block truncate font-mono text-xs text-ink-3">{account.email}</span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-ink-3 group-hover:text-accent" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
}
