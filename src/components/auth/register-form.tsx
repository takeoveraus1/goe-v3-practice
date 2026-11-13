"use client";

import { Dumbbell, Whistle } from "lucide-react";
import { useState } from "react";
import { register } from "@/app/actions/auth";
import { Field, Input } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/cn";
import { useFormAction } from "@/lib/use-form-action";

const ROLES = [
  { value: "athlete", label: "I'm an athlete", description: "Track my game and progress", icon: Dumbbell },
  { value: "coach", label: "I'm a coach", description: "Evaluate and develop players", icon: Whistle },
] as const;

export function RegisterForm({ defaultInviteCode }: { defaultInviteCode: string }) {
  const { state, onSubmit, pending } = useFormAction(register);
  const [role, setRole] = useState<"athlete" | "coach">("athlete");
  const errors = state.fieldErrors ?? {};

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
      <fieldset>
        <legend className="sr-only">Account type</legend>
        <div className="grid grid-cols-2 gap-3">
          {ROLES.map(({ value, label, description, icon: Icon }) => (
            <label
              key={value}
              className={cn(
                "flex cursor-pointer flex-col gap-1 rounded-xl border p-3 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent",
                role === value ? "border-accent bg-accent-soft" : "border-line-strong bg-surface-2 hover:border-ink-3",
              )}
            >
              <input
                type="radio"
                name="role"
                value={value}
                checked={role === value}
                onChange={() => setRole(value)}
                className="sr-only"
              />
              <Icon className={cn("size-5", role === value ? "text-accent" : "text-ink-3")} aria-hidden />
              <span className="text-sm font-medium text-ink">{label}</span>
              <span className="text-xs text-ink-3">{description}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <Field label="Full name" htmlFor="name" error={errors.name}>
        <Input id="name" name="name" autoComplete="name" required />
      </Field>
      <Field label="Email" htmlFor="email" error={errors.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Password" htmlFor="password" error={errors.password} hint="At least 8 characters.">
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
      </Field>
      {role === "athlete" ? (
        <Field
          label="Coach invite code (optional)"
          htmlFor="inviteCode"
          error={errors.inviteCode}
          hint="Your coach can find this on their dashboard. You can add it later."
        >
          <Input
            id="inviteCode"
            name="inviteCode"
            defaultValue={defaultInviteCode}
            autoComplete="off"
            className="font-mono uppercase tracking-widest"
          />
        </Field>
      ) : null}
      <FormMessage state={state.fieldErrors ? { error: state.error } : state} />
      <SubmitButton pending={pending} size="lg" className="w-full" pendingLabel="Creating account…">
        Create account
      </SubmitButton>
    </form>
  );
}
