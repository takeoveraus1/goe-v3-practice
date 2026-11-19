import { Check, CircleDashed, Flag, NotebookPen, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { V3_GOAL_HORIZONS, V3_MAX_CATEGORIES, v3ArchetypeName, v3ContextName, v3TrendName } from "@/config/v3";
import type { Role } from "@/db/schema";
import { cn } from "@/lib/cn";
import { formatDate, relativeDay } from "@/lib/dates";
import type { V3BlockView, V3GoalView, V3Plan } from "@/lib/v3/data";
import { v3NextSetupStep, v3SetupSteps, type V3SetupStepKey } from "@/lib/v3/setup";
import { StepToggle } from "./step-toggle";
import { TrendLegend, TrendMark } from "./trend";

/**
 * The dashboard, top to bottom: Identity & Archetype → Training Block →
 * Player Roadmap → Action Steps. The same for the athlete and their coach.
 */

const day = (iso: string) => formatDate(iso, { weekday: "short", day: "numeric", month: "short" });
const dayWithYear = (iso: string) => formatDate(iso, { day: "numeric", month: "short", year: "numeric" });

function EditLink({ href, label = "Edit" }: { href: string; label?: string }) {
  return (
    <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-practice hover:underline">
      <Pencil className="size-3.5" aria-hidden />
      {label}
    </Link>
  );
}

function Section({ id, title, description, action, children }: { id: string; title: string; description: string; action?: ReactNode; children: ReactNode }) {
  return (
    <Card id={id} aria-labelledby={`${id}-title`}>
      <div className="flex items-start justify-between gap-4 px-5 pt-5">
        <div className="min-w-0">
          <h2 id={`${id}-title`} className="text-lg font-semibold">
            {title}
          </h2>
          <p className="mt-1 text-sm text-ink-3">{description}</p>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </Card>
  );
}

function Empty({ children, action }: { children: ReactNode; action: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-line-strong p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-ink-3">{children}</p>
      {action}
    </div>
  );
}

/** "Week 3 check-in is due today", "Week 2 checked in ✓", … */
export function CheckInStatusLine({ block, today }: { block: V3BlockView; today: string }) {
  const s = block.checkInStatus;
  let text: ReactNode;
  let tone = "text-ink-2";
  switch (s.kind) {
    case "not_started":
      text = `Weekly check-ins start when the block does (${day(s.startsOn)}).`;
      break;
    case "open":
      tone = s.dueToday ? "text-warn" : "text-ink";
      text = s.dueToday ? `Week ${s.week} check-in is due today.` : `Week ${s.week} check-in is open · due ${day(s.dueDate)} (${relativeDay(s.dueDate, today)}).`;
      break;
    case "done":
      tone = "text-good";
      text = s.nextDueDate ? `Week ${s.week} checked in ✓ · next one due ${day(s.nextDueDate)}.` : `Week ${s.week} checked in ✓ · that's the last week of the block.`;
      break;
    case "finished":
      text = "Block finished.";
      break;
  }
  return (
    <div className="text-sm">
      <p className={tone}>{text}</p>
      {block.missedWeeks.length > 0 ? (
        <p className="mt-1 text-xs text-warn">Missed: week {block.missedWeeks.join(", ")} – you can still catch up.</p>
      ) : null}
    </div>
  );
}

const SETUP_HREF: Record<V3SetupStepKey, string> = { identity: "/profile", block: "/blocks/new", roadmap: "/roadmap", steps: "/goals" };

/** Shown until all four parts are set up, in the same order as the dashboard. */
function GettingStarted({ plan, base }: { plan: V3Plan; base: string }) {
  const steps = v3SetupSteps({
    profile: plan.profile,
    blockCount: plan.blocks.length,
    stepCount: Object.values(plan.goals).reduce((n, g) => n + (g?.steps.length ?? 0), 0),
  });
  const next = v3NextSetupStep(steps);
  if (!next) return null;
  return (
    <Card className="border-practice-line p-5">
      <h2 className="font-semibold">Set up the plan in this order</h2>
      <p className="mt-1 text-sm text-ink-3">Each part below matches a section of this page, from top to bottom.</p>
      <ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => (
          <li key={step.key}>
            <Link
              href={`${base}${SETUP_HREF[step.key]}`}
              className={cn(
                "flex h-full items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors",
                step.key === next.key ? "border-accent bg-accent-soft hover:bg-accent-soft/70" : "border-line bg-surface-2/50 hover:border-line-strong",
              )}
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  step.done ? "bg-good text-canvas" : "bg-surface-3 text-ink-2",
                )}
                aria-hidden
              >
                {step.done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
              </span>
              <span className="min-w-0">
                <span className="block font-medium text-ink">{step.label}</span>
                <span className={cn("block text-xs", step.done ? "text-good" : step.key === next.key ? "text-accent" : "text-ink-3")}>
                  {step.done ? "Done" : step.key === next.key ? "Do this next" : "To do"}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function IdentitySection({ plan, base }: { plan: V3Plan; base: string }) {
  const p = plan.profile;
  const primary = v3ArchetypeName(p?.primaryArchetype);
  const secondary = v3ArchetypeName(p?.secondaryArchetype);
  return (
    <Section id="identity" title="Identity & Archetype" description="Who the player is, and where they're at right now." action={<EditLink href={`${base}/profile`} />}>
      {primary || (p && p.contexts.length) ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-ink-3">Archetype</p>
            {primary ? (
              <p className="mt-1 text-lg font-semibold leading-snug">
                {primary}
                {secondary ? <span className="font-normal text-ink-2"> with {secondary}</span> : null}
              </p>
            ) : (
              <p className="mt-1 text-sm text-ink-3">Not set yet.</p>
            )}
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-ink-3">Current context</p>
            {p && p.contexts.length > 0 ? (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {p.contexts.map((c) => (
                  <li key={c}>
                    <Badge tone="accent">{v3ContextName(c)}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-ink-3">Not set yet.</p>
            )}
            {p?.contextNote ? <p className="mt-2 whitespace-pre-line text-sm text-ink-2">{p.contextNote}</p> : null}
          </div>
        </div>
      ) : (
        <Empty action={<ButtonLink href={`${base}/profile`} size="sm">Set identity & archetype</ButtonLink>}>
          Pick an archetype (just a label – no scores) and say where things are at: off-season, lead-up to trials, coming back from injury…
        </Empty>
      )}
    </Section>
  );
}

const PHASE_BADGE = {
  current: { tone: "accent", label: "Current" },
  upcoming: { tone: "neutral", label: "Upcoming" },
  past: { tone: "neutral", label: "Finished" },
} as const;

function TrainingBlockSection({ plan, today, base, viewerRole }: { plan: V3Plan; today: string; base: string; viewerRole: Role }) {
  const block = plan.currentBlock ?? plan.nextBlock;
  const others = [...plan.blocks].reverse().filter((b) => b.id !== block?.id);
  const newBlock = (
    <ButtonLink href={`${base}/blocks/new`} size="sm" variant={block ? "secondary" : "primary"}>
      <Plus className="size-4" aria-hidden />
      New block
    </ButtonLink>
  );

  if (!block) {
    return (
      <Section id="training-block" title="Training Block" description={`The block's dates and up to ${V3_MAX_CATEGORIES} focus areas, rated each week.`}>
        <Empty action={newBlock}>No training block yet. Set the dates and up to {V3_MAX_CATEGORIES} things to work on.</Empty>
        {others.length ? <OtherBlocks blocks={others} base={base} /> : null}
      </Section>
    );
  }

  const { progress } = block;
  const isCurrent = progress.phase === "current";
  const status = block.checkInStatus;
  const weeks = Array.from({ length: progress.totalWeeks }, (_, i) => i + 1);

  return (
    <Section
      id="training-block"
      title="Training Block"
      description="Each focus area is rated every week: trending up, staying the same, or trending down."
      action={<EditLink href={`${base}/blocks/${block.id}`} />}
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 className="text-xl font-semibold tracking-tight">{block.name}</h3>
          <p className="text-sm text-ink-2 tabular">
            {day(block.startDate)} → {day(block.endDate)}
            <span className="text-ink-3">
              {" · "}
              {isCurrent ? (
                <span className="font-medium text-ink">
                  Week {progress.currentWeek} of {progress.totalWeeks}
                </span>
              ) : (
                <span className="font-medium text-practice">Starts {relativeDay(block.startDate, today)}</span>
              )}
            </span>
          </p>
        </div>

        {block.categories.length > 0 ? (
          <div className="space-y-3">
            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full text-sm">
                <caption className="sr-only">Focus areas, rated week by week</caption>
                <thead>
                  <tr className="border-b border-line bg-surface-2/50 text-left text-xs text-ink-3">
                    <th scope="col" className="px-3 py-2 font-medium">
                      Focus area
                    </th>
                    {weeks.map((w) => (
                      <th
                        key={w}
                        scope="col"
                        className={cn("px-1.5 py-2 text-center font-medium whitespace-nowrap", w === progress.currentWeek && "text-practice")}
                        aria-current={w === progress.currentWeek ? "date" : undefined}
                      >
                        Week {w}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.categories.map((cat) => (
                    <tr key={cat.id} className="border-b border-line last:border-0">
                      <th scope="row" className="px-3 py-2.5 text-left font-medium">
                        {cat.name}
                      </th>
                      {cat.weekly.map((w) => (
                        <td key={w.week} className="px-1.5 py-2 text-center">
                          <TrendMark trend={w.trend} current={w.week === progress.currentWeek} label={`${cat.name}, week ${w.week}: ${w.trend ? v3TrendName(w.trend) : "not rated yet"}`} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <TrendLegend />
          </div>
        ) : null}

        <div className="flex flex-col gap-3 rounded-xl bg-surface-2/70 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <NotebookPen className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden />
            <div>
              <CheckInStatusLine block={block} today={today} />
              {block.nextReview ? (
                <p className="mt-1 text-xs text-ink-3">
                  Next review: <span className="text-ink-2">{block.nextReview.label}</span> · {day(block.nextReview.date)} ({relativeDay(block.nextReview.date, today)})
                </p>
              ) : null}
            </div>
          </div>
          {viewerRole === "athlete" && isCurrent ? (
            <ButtonLink href="/athlete/check-ins/new" size="sm" variant={status.kind === "open" ? "primary" : "secondary"} className="shrink-0">
              {status.kind === "open" ? `Check in for week ${status.week}` : "Open check-in"}
            </ButtonLink>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          {others.length ? <OtherBlocks blocks={others} base={base} /> : <p className="text-xs text-ink-3">No other blocks yet.</p>}
          {newBlock}
        </div>
      </div>
    </Section>
  );
}

function OtherBlocks({ blocks, base }: { blocks: V3BlockView[]; base: string }) {
  return (
    <div className="min-w-0 text-sm">
      <p className="text-xs font-medium text-ink-3">Other blocks</p>
      <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
        {blocks.map((b) => {
          const badge = PHASE_BADGE[b.progress.phase];
          return (
            <li key={b.id} className="flex items-center gap-2">
              <Link href={`${base}/blocks/${b.id}`} className="text-ink-2 hover:text-ink hover:underline">
                {b.name}
              </Link>
              <Badge tone={badge.tone}>{badge.label}</Badge>
              <span className="text-xs text-ink-3 tabular">
                {formatDate(b.startDate)} – {formatDate(b.endDate)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function RoadmapSection({ plan, today, base }: { plan: V3Plan; today: string; base: string }) {
  const p = plan.profile;
  const hasAim = Boolean(p?.aimTeam || p?.aimRole);
  const milestones = plan.milestones;
  return (
    <Section
      id="roadmap"
      title="Player Roadmap"
      description="Where the player is aiming to be in about three years: which team, and what role in that team."
      action={<EditLink href={`${base}/roadmap`} />}
    >
      {hasAim ? (
        <div className="space-y-5">
          <div className="rounded-xl border border-accent/30 bg-accent-soft/40 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-accent">In about 3 years{p?.aimYear ? ` · by ${p.aimYear}` : ""}</p>
            <dl className="mt-2 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-ink-3">Team</dt>
                <dd className="text-lg font-semibold leading-snug">{p?.aimTeam || <span className="text-sm font-normal text-ink-3">Not set</span>}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-3">Role in that team</dt>
                <dd className="text-lg font-semibold leading-snug">{p?.aimRole || <span className="text-sm font-normal text-ink-3">Not set</span>}</dd>
              </div>
            </dl>
          </div>
          <div>
            <p className="text-xs font-medium text-ink-3">Milestones on the way</p>
            {milestones.length ? (
              <ol className="mt-2 space-y-2">
                {milestones.map((m) => {
                  const past = m.date < today;
                  return (
                    <li key={m.id} className={cn("flex gap-3", past && "opacity-55")}>
                      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-3 text-ink-2">
                        {past ? <Check className="size-3.5" aria-hidden /> : <Flag className="size-3.5" aria-hidden />}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{m.title}</p>
                        <p className="text-xs text-ink-3 tabular">
                          {dayWithYear(m.date)}
                          {past ? "" : ` · ${relativeDay(m.date, today)}`}
                          {m.detail ? ` · ${m.detail}` : ""}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="mt-1 text-sm text-ink-3">None yet – trials, the season start, camps, showcases.</p>
            )}
          </div>
        </div>
      ) : (
        <Empty action={<ButtonLink href={`${base}/roadmap`} size="sm">Set the roadmap</ButtonLink>}>
          Which team is the player aiming for in about three years, and what role in that team?
        </Empty>
      )}
    </Section>
  );
}

function GoalSteps({ horizon, goal, today }: { horizon: (typeof V3_GOAL_HORIZONS)[number]; goal: V3GoalView | undefined; today: string }) {
  const done = goal?.steps.filter((s) => s.doneAt).length ?? 0;
  const total = goal?.steps.length ?? 0;
  return (
    <div className="flex flex-col rounded-xl border border-line bg-surface-2/40 p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-accent">{horizon.name}</p>
      {goal ? (
        <>
          <h3 className="mt-1.5 text-base font-semibold leading-snug">{goal.title}</h3>
          {goal.targetDate ? (
            <p className="mt-1 text-xs text-ink-3">
              By {dayWithYear(goal.targetDate)} ({relativeDay(goal.targetDate, today)})
            </p>
          ) : null}
          {total > 0 ? (
            <>
              <div className="mt-4 flex items-center justify-between gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3" aria-hidden>
                  <div className="h-full rounded-full bg-good" style={{ width: `${(done / total) * 100}%` }} />
                </div>
                <p className="text-xs text-ink-3 tabular">
                  {done}/{total} done
                </p>
              </div>
              <ol className="mt-3 space-y-2.5">
                {goal.steps.map((s, i) => (
                  <StepToggle key={s.id} stepId={s.id} number={i + 1} text={s.text} done={Boolean(s.doneAt)} canEdit />
                ))}
              </ol>
            </>
          ) : (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-3">
              <CircleDashed className="size-4" aria-hidden />
              No steps yet.
            </p>
          )}
        </>
      ) : (
        <p className="mt-1.5 text-sm text-ink-3">{horizon.hint} Not set yet.</p>
      )}
    </div>
  );
}

function ActionStepsSection({ plan, today, base }: { plan: V3Plan; today: string; base: string }) {
  const hasAny = V3_GOAL_HORIZONS.some((h) => plan.goals[h.key]);
  return (
    <Section
      id="action-steps"
      title="Action Steps"
      description="What has to happen, step by step. Tick each step off when it's done."
      action={<EditLink href={`${base}/goals`} />}
    >
      {hasAny ? (
        <div className="grid gap-3 md:grid-cols-2">
          {V3_GOAL_HORIZONS.map((h) => (
            <GoalSteps key={h.key} horizon={h} goal={plan.goals[h.key]} today={today} />
          ))}
        </div>
      ) : (
        <Empty action={<ButtonLink href={`${base}/goals`} size="sm">Add action steps</ButtonLink>}>
          Set the most pressing goal (and a longer-term one if you like), then break each into steps.
        </Empty>
      )}
    </Section>
  );
}

export function PlanView({ plan, today, base, viewerRole }: { plan: V3Plan; today: string; base: string; viewerRole: Role }) {
  return (
    <div className="space-y-4">
      <GettingStarted plan={plan} base={base} />
      <IdentitySection plan={plan} base={base} />
      <TrainingBlockSection plan={plan} today={today} base={base} viewerRole={viewerRole} />
      <RoadmapSection plan={plan} today={today} base={base} />
      <ActionStepsSection plan={plan} today={today} base={base} />
    </div>
  );
}
