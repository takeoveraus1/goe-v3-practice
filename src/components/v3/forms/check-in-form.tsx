"use client";

import { useState } from "react";
import { saveV3CheckIn } from "@/app/actions/v3";
import { TREND_ICON } from "@/components/v3/trend";
import { Field, FieldError, Select, Textarea } from "@/components/ui/field";
import { V3_TRENDS, type V3Trend } from "@/config/v3";
import { cn } from "@/lib/cn";
import { useFormAction } from "@/lib/use-form-action";
import { FormFooter, Section } from "./form-bits";

export interface V3CheckInWeekOption {
  week: number;
  /** e.g. "3–9 Nov" */
  label: string;
  done: boolean;
}

export interface V3CheckInSaved {
  weekNumber: number;
  notes: string | null;
  trends: Array<{ categoryId: string; trend: V3Trend; note: string | null }>;
}

const CHECKED: Record<V3Trend, string> = {
  up: "peer-checked:border-good peer-checked:bg-good-soft peer-checked:text-good",
  same: "peer-checked:border-ink-2 peer-checked:bg-surface-3 peer-checked:text-ink",
  down: "peer-checked:border-bad peer-checked:bg-bad-soft peer-checked:text-bad",
};

/** The weekly check-in: each category trending up, staying the same or trending down. */
export function V3CheckInForm({
  blockId,
  blockName,
  weeks,
  defaultWeek,
  categories,
  existing,
}: {
  blockId: string;
  blockName: string;
  weeks: V3CheckInWeekOption[];
  defaultWeek: number;
  categories: Array<{ id: string; name: string; detail: string | null }>;
  existing: V3CheckInSaved[];
}) {
  const { state, onSubmit, pending } = useFormAction(saveV3CheckIn);
  const [week, setWeek] = useState(defaultWeek);
  const current = existing.find((c) => c.weekNumber === week);
  const e = state.fieldErrors ?? {};

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <input type="hidden" name="blockId" value={blockId} />
      <Section
        title={current ? `Update your week ${week} check-in` : `Week ${week} check-in`}
        description={`${blockName}. How has each category trended this week?`}
        action={
          <Field label="Week" htmlFor="week" error={e.week} className="w-full shrink-0 sm:w-64">
            <Select id="week" name="week" value={week} onChange={(ev) => setWeek(Number(ev.target.value))}>
              {weeks.map((w) => (
                <option key={w.week} value={w.week}>
                  Week {w.week} · {w.label}
                  {w.done ? " ✓" : ""}
                </option>
              ))}
            </Select>
          </Field>
        }
      >
        {/* Remount per week so the fields show that week's saved answers. */}
        <div key={week} className="space-y-3">
          {categories.map((cat) => {
            const saved = current?.trends.find((t) => t.categoryId === cat.id);
            const name = `trend.${cat.id}`;
            return (
              <div key={cat.id} className="rounded-xl border border-line bg-surface-2/50 p-4">
                <fieldset aria-describedby={e[name] ? `${cat.id}-error` : undefined}>
                  <legend className="font-medium">{cat.name}</legend>
                  {cat.detail ? <p className="mt-0.5 text-xs text-ink-3">{cat.detail}</p> : null}
                  <div className="mt-3 grid grid-cols-3 gap-2 sm:max-w-lg">
                    {V3_TRENDS.map((t) => {
                      const Icon = TREND_ICON[t.key];
                      return (
                        <label key={t.key} className="relative">
                          <input type="radio" name={name} value={t.key} defaultChecked={saved?.trend === t.key} className="peer sr-only" />
                          <span
                            className={cn(
                              "flex h-12 cursor-pointer flex-col items-center justify-center rounded-lg border border-line-strong bg-surface-2 text-xs font-medium text-ink-2 transition-colors hover:border-ink-3 sm:h-11 sm:flex-row sm:gap-1.5 sm:text-sm",
                              "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent",
                              CHECKED[t.key],
                            )}
                          >
                            <Icon className="size-4" aria-hidden />
                            {t.name}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <FieldError id={`${cat.id}-error`}>{e[name]}</FieldError>
                </fieldset>
                <Field label="What happened? (optional)" htmlFor={`note.${cat.id}`} className="mt-3">
                  <Textarea id={`note.${cat.id}`} name={`note.${cat.id}`} rows={2} defaultValue={saved?.note ?? ""} placeholder="What did you do or notice this week?" />
                </Field>
              </div>
            );
          })}
          <Field label="Anything else this week?" htmlFor="notes">
            <Textarea id="notes" name="notes" rows={3} defaultValue={current?.notes ?? ""} placeholder="How the body feels, games, wins, what got in the way…" />
          </Field>
        </div>
      </Section>
      <FormFooter state={state} pending={pending} cancelHref="/athlete/check-ins" submitLabel={current ? "Update check-in" : "Save check-in"} />
    </form>
  );
}
