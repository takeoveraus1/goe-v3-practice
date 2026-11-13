"use client";

import { useState } from "react";
import { saveV3Block } from "@/app/actions/v3";
import { Field, FieldError, Input, Textarea } from "@/components/ui/field";
import { V3_DEFAULT_REVIEW_LABELS, V3_MAX_CATEGORIES, V3_MAX_REVIEW_POINTS } from "@/config/v3";
import { addDays, formatDate, isIsoDate } from "@/lib/dates";
import { suggestedReviewDates, v3BlockWeeks } from "@/lib/v3/blocks";
import { useFormAction } from "@/lib/use-form-action";
import { AddRowButton, FormFooter, move, rowKey, RowControls, Section } from "./form-bits";

export interface V3BlockDefaults {
  id: string | null;
  name: string;
  startDate: string;
  endDate: string;
  notes: string | null;
  reviewPoints: Array<{ date: string; label: string }>;
  categories: Array<{ id: string | null; name: string; detail: string | null }>;
}

interface CategoryRow {
  key: string;
  id: string | null;
  name: string;
  detail: string;
}
interface ReviewRow {
  key: string;
  date: string;
  label: string;
}

function suggestedReviews(startDate: string, endDate: string): ReviewRow[] {
  if (!isIsoDate(startDate) || !isIsoDate(endDate) || endDate < startDate) return [];
  const { mid, end } = suggestedReviewDates({ startDate, endDate });
  return [
    ...(mid ? [{ key: rowKey(), date: mid, label: V3_DEFAULT_REVIEW_LABELS.mid }] : []),
    { key: rowKey(), date: end, label: V3_DEFAULT_REVIEW_LABELS.end },
  ];
}

/** Block dates, review points and up to four open-ended categories. */
export function V3BlockForm({
  athleteId,
  defaults,
  cancelHref,
  carriedFrom,
}: {
  athleteId: string;
  defaults: V3BlockDefaults;
  cancelHref: string;
  /** Name of the block the categories were carried over from (new blocks only). */
  carriedFrom?: string | null;
}) {
  const { state, onSubmit, pending } = useFormAction(saveV3Block);
  const e = state.fieldErrors ?? {};
  const isNew = !defaults.id;

  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [categories, setCategories] = useState<CategoryRow[]>(() => {
    const rows = defaults.categories.map((c) => ({ key: rowKey(), id: c.id, name: c.name, detail: c.detail ?? "" }));
    return rows.length ? rows : [{ key: rowKey(), id: null, name: "", detail: "" }];
  });
  const [reviews, setReviews] = useState<ReviewRow[]>(() =>
    defaults.reviewPoints.length || !isNew
      ? defaults.reviewPoints.map((r) => ({ key: rowKey(), ...r }))
      : suggestedReviews(defaults.startDate, defaults.endDate),
  );
  // New blocks keep the suggested reviews in step with the dates until they're edited by hand.
  const [reviewsTouched, setReviewsTouched] = useState(!isNew);

  function changeDates(nextStart: string, nextEnd: string) {
    setStartDate(nextStart);
    setEndDate(nextEnd);
    if (!reviewsTouched) setReviews(suggestedReviews(nextStart, nextEnd));
  }

  const updateCategory = (i: number, patch: Partial<CategoryRow>) => setCategories((rows) => rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const updateReview = (i: number, patch: Partial<ReviewRow>) => {
    setReviewsTouched(true);
    setReviews((rows) => rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  };

  const validRange = isIsoDate(startDate) && isIsoDate(endDate) && endDate >= startDate;
  const weeks = validRange ? v3BlockWeeks({ startDate, endDate }) : null;

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <input type="hidden" name="athleteId" value={athleteId} />
      {defaults.id ? <input type="hidden" name="blockId" value={defaults.id} /> : null}

      <Section title="Block dates" description="When it starts and when it finishes. Blocks run one after another.">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Block name" htmlFor="name" error={e.name} className="sm:col-span-3" hint="e.g. “Off-season base”, “Lead-up to trials”, “Return to play”.">
            <Input id="name" name="name" defaultValue={defaults.name} maxLength={80} />
          </Field>
          <Field label="Starts" htmlFor="startDate" error={e.startDate}>
            <Input id="startDate" name="startDate" type="date" value={startDate} onChange={(ev) => changeDates(ev.target.value, endDate)} />
          </Field>
          <Field label="Finishes" htmlFor="endDate" error={e.endDate}>
            <Input id="endDate" name="endDate" type="date" value={endDate} min={startDate || undefined} onChange={(ev) => changeDates(startDate, ev.target.value)} />
          </Field>
          <div className="flex items-end pb-2.5 text-sm text-ink-3">
            {weeks ? (
              <span>
                {weeks} week{weeks === 1 ? "" : "s"} · check-in due each {formatDate(addDays(startDate, 6), { weekday: "long" })}
              </span>
            ) : null}
          </div>
        </div>
      </Section>

      <Section
        title="Review points"
        description="When the block gets reviewed – usually halfway and at the end."
        action={
          <button
            type="button"
            onClick={() => {
              setReviewsTouched(true);
              setReviews(suggestedReviews(startDate, endDate));
            }}
            className="shrink-0 text-sm font-medium text-practice hover:underline disabled:opacity-40"
            disabled={!validRange}
          >
            Suggest
          </button>
        }
      >
        <div className="space-y-3">
          {reviews.map((r, i) => (
            <div key={r.key} className="flex items-start gap-2">
              <div className="grid flex-1 gap-2 sm:grid-cols-[180px_1fr]">
                <div>
                  <Input
                    name={`review.${i}.date`}
                    type="date"
                    aria-label={`Review point ${i + 1} date`}
                    value={r.date}
                    min={startDate || undefined}
                    max={endDate || undefined}
                    onChange={(ev) => updateReview(i, { date: ev.target.value })}
                  />
                  <FieldError>{e[`review.${i}.date`]}</FieldError>
                </div>
                <div>
                  <Input
                    name={`review.${i}.label`}
                    aria-label={`Review point ${i + 1} label`}
                    placeholder="Mid-block review"
                    value={r.label}
                    maxLength={60}
                    onChange={(ev) => updateReview(i, { label: ev.target.value })}
                  />
                  <FieldError>{e[`review.${i}.label`]}</FieldError>
                </div>
              </div>
              <RowControls
                label={`review point ${i + 1}`}
                onRemove={() => {
                  setReviewsTouched(true);
                  setReviews((rows) => rows.filter((_, j) => j !== i));
                }}
              />
            </div>
          ))}
          <FieldError>{e.reviews}</FieldError>
          <AddRowButton
            disabled={reviews.length >= V3_MAX_REVIEW_POINTS}
            onClick={() => {
              setReviewsTouched(true);
              setReviews((rows) => [...rows, { key: rowKey(), date: "", label: "" }]);
            }}
          >
            Add review point
          </AddRowButton>
        </div>
      </Section>

      <Section
        title={`What you're working on (up to ${V3_MAX_CATEGORIES})`}
        description={
          carriedFrom ? (
            <>
              Carried over from <span className="text-ink-2">{carriedFrom}</span> – keep, change or replace them. Anything goes; there&apos;s no fixed list.
            </>
          ) : (
            "Open-ended – name them however makes sense to you. Each one gets a trend in the weekly check-in."
          )
        }
      >
        <div className="space-y-3">
          {categories.map((c, i) => (
            <div key={c.key} className="flex items-start gap-2 rounded-xl border border-line bg-surface-2/40 p-3">
              <span className="mt-2 flex size-6 shrink-0 items-center justify-center rounded-full bg-practice-soft text-xs font-semibold text-practice">{i + 1}</span>
              {c.id ? <input type="hidden" name={`category.${i}.id`} value={c.id} /> : null}
              <div className="grid flex-1 gap-2">
                <div>
                  <Input
                    name={`category.${i}.name`}
                    aria-label={`Category ${i + 1}`}
                    placeholder={["e.g. Ball security under pressure", "e.g. Communication – calling screens", "e.g. Conditioning", "e.g. Confidence shooting off the catch"][i]}
                    value={c.name}
                    maxLength={80}
                    onChange={(ev) => updateCategory(i, { name: ev.target.value })}
                  />
                  <FieldError>{e[`category.${i}.name`]}</FieldError>
                </div>
                <div>
                  <Textarea
                    name={`category.${i}.detail`}
                    aria-label={`Category ${i + 1} details`}
                    rows={2}
                    placeholder="What it looks like when it's going well, cues, how you'll measure it (optional)"
                    value={c.detail}
                    onChange={(ev) => updateCategory(i, { detail: ev.target.value })}
                  />
                  <FieldError>{e[`category.${i}.detail`]}</FieldError>
                </div>
              </div>
              <RowControls
                label={`category ${i + 1}`}
                onUp={i > 0 ? () => setCategories((rows) => move(rows, i, i - 1)) : null}
                onDown={i < categories.length - 1 ? () => setCategories((rows) => move(rows, i, i + 1)) : null}
                onRemove={() => setCategories((rows) => rows.filter((_, j) => j !== i))}
              />
            </div>
          ))}
          <FieldError>{e.categories}</FieldError>
          <AddRowButton
            disabled={categories.length >= V3_MAX_CATEGORIES}
            onClick={() => setCategories((rows) => [...rows, { key: rowKey(), id: null, name: "", detail: "" }])}
          >
            {categories.length >= V3_MAX_CATEGORIES ? `${V3_MAX_CATEGORIES} is the max` : "Add category"}
          </AddRowButton>
          {!isNew ? <p className="text-xs text-ink-3">Removing a category also removes its weekly trends from this block&apos;s check-ins.</p> : null}
        </div>
      </Section>

      <Section title="Notes (optional)">
        <Field label="Anything else about this block" htmlFor="notes" error={e.notes}>
          <Textarea id="notes" name="notes" rows={3} defaultValue={defaults.notes ?? ""} />
        </Field>
      </Section>

      <FormFooter state={state} pending={pending} cancelHref={cancelHref} submitLabel={isNew ? "Create block" : "Save block"} />
    </form>
  );
}
