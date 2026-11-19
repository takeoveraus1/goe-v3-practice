"use client";

import { useState } from "react";
import { saveV3Roadmap } from "@/app/actions/v3";
import { Field, FieldError, Input, Select } from "@/components/ui/field";
import { V3_MAX_MILESTONES } from "@/config/v3";
import { useFormAction } from "@/lib/use-form-action";
import { AddRowButton, FormFooter, rowKey, RowControls, Section } from "./form-bits";

interface MilestoneRow {
  key: string;
  date: string;
  title: string;
  detail: string;
}

/** The Player Roadmap: where they're aiming to be in ~3 years (team and role), and the milestones on the way. */
export function V3RoadmapForm({
  athleteId,
  aim,
  thisYear,
  defaults,
  cancelHref,
}: {
  athleteId: string;
  aim: { team: string | null; role: string | null; year: number | null };
  thisYear: number;
  defaults: Array<{ date: string; title: string; detail: string | null }>;
  cancelHref: string;
}) {
  const { state, onSubmit, pending } = useFormAction(saveV3Roadmap);
  const e = state.fieldErrors ?? {};
  const [rows, setRows] = useState<MilestoneRow[]>(() => {
    const initial = defaults.map((m) => ({ key: rowKey(), date: m.date, title: m.title, detail: m.detail ?? "" }));
    return initial.length ? initial : [{ key: rowKey(), date: "", title: "", detail: "" }];
  });
  const update = (i: number, patch: Partial<MilestoneRow>) => setRows((r) => r.map((row, j) => (j === i ? { ...row, ...patch } : row)));

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <input type="hidden" name="athleteId" value={athleteId} />
      <Section title="In about 3 years" description="Which team are you aiming to be on, and what role do you want in that team?">
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_160px]">
          <Field label="Team" htmlFor="aimTeam" error={e.aimTeam} hint="e.g. a US college program, NBL1 East, the state team">
            <Input id="aimTeam" name="aimTeam" defaultValue={aim.team ?? ""} maxLength={100} />
          </Field>
          <Field label="Role in that team" htmlFor="aimRole" error={e.aimRole} hint="e.g. starting point guard, sixth man, defensive stopper">
            <Input id="aimRole" name="aimRole" defaultValue={aim.role ?? ""} maxLength={100} />
          </Field>
          <Field label="By" htmlFor="aimYear" error={e.aimYear}>
            <Select id="aimYear" name="aimYear" defaultValue={String(aim.year ?? thisYear + 3)}>
              {Array.from({ length: 8 }, (_, i) => thisYear + i).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Section>
      <Section title="Milestones on the way" description="Trials, the start of the season, camps, showcases – the dates you're building towards.">
        <div className="space-y-3">
          {rows.map((m, i) => (
            <div key={m.key} className="flex items-start gap-2 rounded-xl border border-line bg-surface-2/40 p-3">
              <div className="grid flex-1 gap-2 sm:grid-cols-[170px_1fr]">
                <div>
                  <Input name={`milestone.${i}.date`} type="date" aria-label={`Milestone ${i + 1} date`} value={m.date} onChange={(ev) => update(i, { date: ev.target.value })} />
                  <FieldError>{e[`milestone.${i}.date`]}</FieldError>
                </div>
                <div>
                  <Input
                    name={`milestone.${i}.title`}
                    aria-label={`Milestone ${i + 1}`}
                    placeholder="e.g. State U20 trials"
                    value={m.title}
                    maxLength={100}
                    onChange={(ev) => update(i, { title: ev.target.value })}
                  />
                  <FieldError>{e[`milestone.${i}.title`]}</FieldError>
                </div>
                <div className="sm:col-span-2">
                  <Input
                    name={`milestone.${i}.detail`}
                    aria-label={`Milestone ${i + 1} details`}
                    placeholder="Details (optional)"
                    value={m.detail}
                    maxLength={300}
                    onChange={(ev) => update(i, { detail: ev.target.value })}
                  />
                  <FieldError>{e[`milestone.${i}.detail`]}</FieldError>
                </div>
              </div>
              <RowControls label={`milestone ${i + 1}`} onRemove={() => setRows((r) => r.filter((_, j) => j !== i))} />
            </div>
          ))}
          <FieldError>{e.milestones}</FieldError>
          <AddRowButton disabled={rows.length >= V3_MAX_MILESTONES} onClick={() => setRows((r) => [...r, { key: rowKey(), date: "", title: "", detail: "" }])}>
            Add milestone
          </AddRowButton>
        </div>
      </Section>
      <FormFooter state={state} pending={pending} cancelHref={cancelHref} submitLabel="Save roadmap" />
    </form>
  );
}
