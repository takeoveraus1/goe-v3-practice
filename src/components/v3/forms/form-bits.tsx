"use client";

import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import type { FormState } from "@/lib/form-state";

let nextKey = 0;
/** A stable React key for a row added on the client. */
export const rowKey = () => `row-${++nextKey}`;

export function Section({ title, description, action, children }: { title: string; description?: ReactNode; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-semibold">{title}</h2>
          {description ? <p className="mt-1 text-sm text-ink-3">{description}</p> : null}
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function AddRowButton({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-line-strong px-3 py-2 text-sm font-medium text-ink-2 hover:border-practice hover:text-practice disabled:pointer-events-none disabled:opacity-40"
    >
      <Plus className="size-4" aria-hidden />
      {children}
    </button>
  );
}

export function RowControls({
  label,
  onRemove,
  onUp,
  onDown,
}: {
  label: string;
  onRemove: () => void;
  onUp?: (() => void) | null;
  onDown?: (() => void) | null;
}) {
  const btn = "flex size-8 items-center justify-center rounded-lg text-ink-3 hover:bg-surface-3 hover:text-ink disabled:opacity-30 disabled:pointer-events-none";
  return (
    <div className="flex shrink-0 items-center">
      {onUp !== undefined ? (
        <button type="button" className={btn} onClick={onUp ?? undefined} disabled={!onUp} aria-label={`Move ${label} up`}>
          <ArrowUp className="size-4" aria-hidden />
        </button>
      ) : null}
      {onDown !== undefined ? (
        <button type="button" className={btn} onClick={onDown ?? undefined} disabled={!onDown} aria-label={`Move ${label} down`}>
          <ArrowDown className="size-4" aria-hidden />
        </button>
      ) : null}
      <button type="button" className={btn} onClick={onRemove} aria-label={`Remove ${label}`}>
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}

export function FormFooter({ state, pending, cancelHref, submitLabel }: { state: FormState; pending: boolean; cancelHref: string; submitLabel: string }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
      <FormMessage state={state} />
      <div className="flex justify-end gap-2">
        <ButtonLink href={cancelHref} variant="ghost">
          Cancel
        </ButtonLink>
        <SubmitButton pending={pending} size="lg">
          {submitLabel}
        </SubmitButton>
      </div>
    </div>
  );
}

export function move<T>(items: T[], from: number, to: number): T[] {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
