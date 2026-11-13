"use client";

import { useState } from "react";
import { saveV3Goals } from "@/app/actions/v3";
import { Field, FieldError, Input, Textarea } from "@/components/ui/field";
import { V3_GOAL_HORIZONS, V3_MAX_STEPS, type V3GoalHorizon } from "@/config/v3";
import { cn } from "@/lib/cn";
import { useFormAction } from "@/lib/use-form-action";
import { AddRowButton, FormFooter, move, rowKey, RowControls, Section } from "./form-bits";

export interface V3GoalDefaults {
  title: string;
  detail: string | null;
  targetDate: string | null;
  steps: Array<{ id: string; text: string; done: boolean }>;
}

interface StepRow {
  key: string;
  id: string | null;
  text: string;
  done: boolean;
}

function GoalSection({ horizon, defaults, errors }: { horizon: (typeof V3_GOAL_HORIZONS)[number]; defaults: V3GoalDefaults | undefined; errors: Record<string, string> }) {
  const h = horizon.key;
  const [steps, setSteps] = useState<StepRow[]>(() => {
    const rows = (defaults?.steps ?? []).map((s) => ({ key: rowKey(), id: s.id, text: s.text, done: s.done }));
    return rows.length ? rows : [{ key: rowKey(), id: null, text: "", done: false }];
  });
  const update = (i: number, patch: Partial<StepRow>) => setSteps((rows) => rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  return (
    <Section title={`${horizon.name} goal`} description={`${horizon.hint} Leave it blank to clear it.`}>
      <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
        <Field label="Goal" htmlFor={`${h}.title`} error={errors[`${h}.title`]}>
          <Input
            id={`${h}.title`}
            name={`${h}.title`}
            defaultValue={defaults?.title ?? ""}
            maxLength={120}
            placeholder={h === "pressing" ? "e.g. Earn a starting spot by round 1" : "e.g. Earn a college roster spot for 2027"}
          />
        </Field>
        <Field label="Target date (optional)" htmlFor={`${h}.targetDate`} error={errors[`${h}.targetDate`]}>
          <Input id={`${h}.targetDate`} name={`${h}.targetDate`} type="date" defaultValue={defaults?.targetDate ?? ""} />
        </Field>
        <Field label="Why it matters / what achieving it looks like (optional)" htmlFor={`${h}.detail`} error={errors[`${h}.detail`]} className="sm:col-span-2">
          <Textarea id={`${h}.detail`} name={`${h}.detail`} rows={2} defaultValue={defaults?.detail ?? ""} />
        </Field>
      </div>

      <div className="mt-5">
        <p className="text-sm font-medium text-ink-2">Action steps, in order</p>
        <p className="mt-0.5 text-xs text-ink-3">Step by step – what has to happen, first to last. Tick off anything already done.</p>
        <ol className="mt-3 space-y-2">
          {steps.map((s, i) => (
            <li key={s.key} className="flex items-start gap-2">
              {s.id ? <input type="hidden" name={`${h}.step.${i}.id`} value={s.id} /> : null}
              <span className="mt-2.5 w-5 shrink-0 text-right text-xs font-medium text-ink-3 tabular">{i + 1}.</span>
              <label className="mt-2.5 shrink-0" title="Done">
                <input
                  type="checkbox"
                  name={`${h}.step.${i}.done`}
                  checked={s.done}
                  onChange={(ev) => update(i, { done: ev.target.checked })}
                  className="size-4 accent-[var(--color-good)]"
                  aria-label={`Step ${i + 1} done`}
                />
              </label>
              <div className="flex-1">
                <Input
                  name={`${h}.step.${i}.text`}
                  aria-label={`Step ${i + 1}`}
                  value={s.text}
                  maxLength={200}
                  onChange={(ev) => update(i, { text: ev.target.value })}
                  className={cn(s.done && "text-ink-3 line-through")}
                  placeholder={i === 0 ? "First step" : "Next step"}
                />
                <FieldError>{errors[`${h}.step.${i}.text`]}</FieldError>
              </div>
              <RowControls
                label={`step ${i + 1}`}
                onUp={i > 0 ? () => setSteps((rows) => move(rows, i, i - 1)) : null}
                onDown={i < steps.length - 1 ? () => setSteps((rows) => move(rows, i, i + 1)) : null}
                onRemove={() => setSteps((rows) => rows.filter((_, j) => j !== i))}
              />
            </li>
          ))}
        </ol>
        <FieldError>{errors[`${h}.steps`]}</FieldError>
        <div className="mt-3">
          <AddRowButton disabled={steps.length >= V3_MAX_STEPS} onClick={() => setSteps((rows) => [...rows, { key: rowKey(), id: null, text: "", done: false }])}>
            Add step
          </AddRowButton>
        </div>
      </div>
    </Section>
  );
}

/** The two goals – most pressing and longer term – each with ordered action steps. */
export function V3GoalsForm({
  athleteId,
  defaults,
  cancelHref,
}: {
  athleteId: string;
  defaults: Partial<Record<V3GoalHorizon, V3GoalDefaults>>;
  cancelHref: string;
}) {
  const { state, onSubmit, pending } = useFormAction(saveV3Goals);
  const e = state.fieldErrors ?? {};
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <input type="hidden" name="athleteId" value={athleteId} />
      {V3_GOAL_HORIZONS.map((h) => (
        <GoalSection key={h.key} horizon={h} defaults={defaults[h.key]} errors={e} />
      ))}
      <FormFooter state={state} pending={pending} cancelHref={cancelHref} submitLabel="Save goals" />
    </form>
  );
}
