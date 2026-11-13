"use client";

import { saveV3Profile } from "@/app/actions/v3";
import { Field, FieldError, Select, Textarea } from "@/components/ui/field";
import { V3_ARCHETYPE_GROUPS, V3_CONTEXTS } from "@/config/v3";
import { useFormAction } from "@/lib/use-form-action";
import { FormFooter, Section } from "./form-bits";

export interface V3ProfileDefaults {
  primaryArchetype: string | null;
  secondaryArchetype: string | null;
  contexts: string[];
  contextNote: string | null;
}

function ArchetypeOptions() {
  return (
    <>
      {V3_ARCHETYPE_GROUPS.map((group) => (
        <optgroup key={group.position} label={group.label}>
          {group.archetypes.map((a) => (
            <option key={a.key} value={a.key}>
              {a.name}
            </option>
          ))}
        </optgroup>
      ))}
    </>
  );
}

/** Archetype labels (no weights) and the athlete's current context. */
export function V3ProfileForm({ athleteId, defaults, cancelHref }: { athleteId: string; defaults: V3ProfileDefaults; cancelHref: string }) {
  const { state, onSubmit, pending } = useFormAction(saveV3Profile);
  const e = state.fieldErrors ?? {};
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <input type="hidden" name="athleteId" value={athleteId} />
      <Section title="Archetype" description="How you'd describe your game. It's a label only – nothing is weighted or scored against it.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Primary archetype" htmlFor="primaryArchetype" error={e.primaryArchetype}>
            <Select id="primaryArchetype" name="primaryArchetype" defaultValue={defaults.primaryArchetype ?? ""}>
              <option value="">Not set</option>
              <ArchetypeOptions />
            </Select>
          </Field>
          <Field label="Secondary archetype (optional)" htmlFor="secondaryArchetype" error={e.secondaryArchetype}>
            <Select id="secondaryArchetype" name="secondaryArchetype" defaultValue={defaults.secondaryArchetype ?? ""}>
              <option value="">None</option>
              <ArchetypeOptions />
            </Select>
          </Field>
        </div>
      </Section>

      <Section title="Current context" description="Where you're at right now. Pick everything that applies.">
        <fieldset aria-describedby={e.contexts ? "contexts-error" : undefined}>
          <legend className="sr-only">Current context</legend>
          <div className="flex flex-wrap gap-2">
            {V3_CONTEXTS.map((c) => (
              <label key={c.key} className="relative">
                <input type="checkbox" name="contexts" value={c.key} defaultChecked={defaults.contexts.includes(c.key)} className="peer sr-only" />
                <span className="flex h-10 cursor-pointer items-center rounded-lg border border-line-strong bg-surface-2 px-4 text-sm font-medium text-ink-2 hover:border-ink-3 peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:text-accent peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent">
                  {c.name}
                </span>
              </label>
            ))}
          </div>
          <FieldError id="contexts-error">{e.contexts}</FieldError>
        </fieldset>
        <Field label="Anything else about right now?" htmlFor="contextNote" error={e.contextNote} className="mt-4" hint="e.g. “State trials 7 Feb”, “Ankle cleared for full contact, building back”.">
          <Textarea id="contextNote" name="contextNote" rows={3} defaultValue={defaults.contextNote ?? ""} />
        </Field>
      </Section>

      <FormFooter state={state} pending={pending} cancelHref={cancelHref} submitLabel="Save" />
    </form>
  );
}
