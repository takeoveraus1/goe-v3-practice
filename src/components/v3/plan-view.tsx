import {
  CalendarClock,
  CalendarRange,
  CircleStop,
  Compass,
  Diamond,
  Flag,
  Layers,
  NotebookPen,
  Pencil,
  Play,
  Plus,
  Route,
  Target,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { V3_GOAL_HORIZONS, V3_MAX_CATEGORIES, v3ArchetypeName, v3ContextName } from "@/config/v3";
import type { Role } from "@/db/schema";
import { cn } from "@/lib/cn";
import { formatDate, relativeDay } from "@/lib/dates";
import type { V3BlockView, V3GoalView, V3Plan } from "@/lib/v3/data";
import { buildV3Timeline, splitTimeline, type V3TimelineEntry, type V3TimelineKind } from "@/lib/v3/timeline";
import { BlockTimelineBar } from "./block-timeline-bar";
import { StepToggle } from "./step-toggle";
import { TrendBadge, TrendStrip } from "./trend";

const day = (iso: string) => formatDate(iso, { weekday: "short", day: "numeric", month: "short" });
const dayWithYear = (iso: string) => formatDate(iso, { day: "numeric", month: "short", year: "numeric" });

function EditLink({ href, children = "Edit" }: { href: string; children?: ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 text-sm font-medium text-practice hover:underline">
      <Pencil className="size-3.5" aria-hidden />
      {children}
    </Link>
  );
}

/** "Week 3 check-in is due today", "Week 2 checked in", … */
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

function IdentityCard({ plan, base }: { plan: V3Plan; base: string }) {
  const p = plan.profile;
  const primary = v3ArchetypeName(p?.primaryArchetype);
  const secondary = v3ArchetypeName(p?.secondaryArchetype);
  return (
    <Card className="flex flex-col">
      <CardHeader title="Archetype & context" action={<EditLink href={`${base}/profile`} />} />
      <CardBody className="flex flex-1 flex-col gap-5">
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
          <p className="mt-1 text-xs text-ink-3">A label for how you play – no weights or scores behind it.</p>
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
            <p className="mt-1 text-sm text-ink-3">Off-season, lead-up to trials, in season, coming back from injury…</p>
          )}
          {p?.contextNote ? <p className="mt-2 whitespace-pre-line text-sm text-ink-2">{p.contextNote}</p> : null}
        </div>
      </CardBody>
    </Card>
  );
}

function BlockCard({ plan, today, base, viewerRole }: { plan: V3Plan; today: string; base: string; viewerRole: Role }) {
  const block = plan.currentBlock ?? plan.nextBlock;
  if (!block) {
    return (
      <Card className="lg:col-span-2">
        <CardHeader title="Training block" />
        <EmptyState
          icon={CalendarRange}
          title="No training block yet"
          action={
            <ButtonLink href={`${base}/blocks/new`}>
              <Plus className="size-4" aria-hidden />
              Set up a block
            </ButtonLink>
          }
        >
          Pick the dates, when you&apos;ll review it, and up to {V3_MAX_CATEGORIES} things to work on.
        </EmptyState>
      </Card>
    );
  }
  const { progress } = block;
  const isCurrent = progress.phase === "current";
  const upNext = isCurrent ? plan.nextBlock : null;
  const canCheckIn = viewerRole === "athlete" && isCurrent;

  return (
    <Card className="lg:col-span-2">
      <CardHeader
        title={isCurrent ? "Current training block" : "Next training block"}
        action={<EditLink href={`${base}/blocks/${block.id}`} />}
      />
      <CardBody className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-xl font-semibold tracking-tight">{block.name}</h3>
            <p className="mt-1 text-sm text-ink-2 tabular">
              {day(block.startDate)} → {day(block.endDate)}
              <span className="text-ink-3"> · {progress.totalWeeks} week{progress.totalWeeks === 1 ? "" : "s"}</span>
            </p>
          </div>
          <div className="sm:text-right">
            {isCurrent ? (
              <>
                <p className="text-2xl font-semibold leading-none tabular">
                  Week {progress.currentWeek}
                  <span className="text-base font-normal text-ink-3"> of {progress.totalWeeks}</span>
                </p>
                <p className="mt-1 text-xs text-ink-3">
                  {progress.daysLeft} day{progress.daysLeft === 1 ? "" : "s"} left
                </p>
              </>
            ) : (
              <p className="text-sm font-medium text-practice">Starts {relativeDay(block.startDate, today)}</p>
            )}
          </div>
        </div>

        <BlockTimelineBar block={block} today={today} />

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-surface-2/70 p-3">
            <p className="flex items-center gap-1.5 text-xs font-medium text-ink-3">
              <Diamond className="size-3.5 text-practice" aria-hidden />
              Review points
            </p>
            {block.reviewPoints.length > 0 ? (
              <ul className="mt-1.5 space-y-1 text-sm">
                {block.reviewPoints.map((r) => {
                  const isNext = block.nextReview?.date === r.date && block.nextReview.label === r.label;
                  return (
                    <li key={`${r.date}-${r.label}`} className={cn("flex justify-between gap-3", r.date < today ? "text-ink-3" : "text-ink")}>
                      <span className={cn(isNext && "font-medium")}>
                        {r.label}
                        {r.date < today ? " ✓" : null}
                      </span>
                      <span className="shrink-0 tabular text-ink-3">
                        {day(r.date)}
                        {isNext ? <span className="text-practice"> · {relativeDay(r.date, today)}</span> : null}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-1.5 text-sm text-ink-3">None set.</p>
            )}
          </div>
          <div className="flex flex-col justify-between gap-3 rounded-xl bg-surface-2/70 p-3">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-medium text-ink-3">
                <NotebookPen className="size-3.5" aria-hidden />
                Weekly check-in
              </p>
              <div className="mt-1.5">
                <CheckInStatusLine block={block} today={today} />
              </div>
            </div>
            {canCheckIn ? (
              <div>
                <ButtonLink
                  href="/athlete/check-ins/new"
                  size="sm"
                  variant={block.checkInStatus.kind === "open" ? "primary" : "secondary"}
                >
                  {block.checkInStatus.kind === "open" ? `Check in for week ${block.checkInStatus.week}` : "Open check-in"}
                </ButtonLink>
              </div>
            ) : null}
          </div>
        </div>

        {block.notes ? <p className="whitespace-pre-line text-sm text-ink-2">{block.notes}</p> : null}

        {upNext ? (
          <p className="flex items-center gap-2 border-t border-line pt-4 text-sm text-ink-3">
            <CalendarClock className="size-4 shrink-0" aria-hidden />
            <span>
              Up next: <span className="font-medium text-ink-2">{upNext.name}</span> · starts {day(upNext.startDate)} ({relativeDay(upNext.startDate, today)})
            </span>
          </p>
        ) : null}
      </CardBody>
    </Card>
  );
}

function CategoriesCard({ plan, base }: { plan: V3Plan; base: string }) {
  const block = plan.currentBlock ?? plan.nextBlock;
  return (
    <Card className="lg:col-span-3">
      <CardHeader
        title="What I'm working on"
        description={
          block
            ? `Up to ${V3_MAX_CATEGORIES} categories for ${block.name}, and how each has trended week by week.`
            : `Up to ${V3_MAX_CATEGORIES} open-ended categories per block – whatever matters most right now.`
        }
        action={block ? <EditLink href={`${base}/blocks/${block.id}`}>Change</EditLink> : null}
      />
      <CardBody>
        {block && block.categories.length > 0 ? (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {block.categories.map((cat, i) => (
              <li key={cat.id} className="flex flex-col rounded-xl border border-line bg-surface-2/50 p-4">
                <div className="flex items-start gap-2">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-practice-soft text-xs font-semibold text-practice tabular">
                    {i + 1}
                  </span>
                  <h3 className="font-semibold leading-snug">{cat.name}</h3>
                </div>
                {cat.detail ? <p className="mt-2 text-sm text-ink-3">{cat.detail}</p> : null}
                <div className="mt-auto space-y-3 pt-4">
                  <TrendBadge trend={cat.latest} />
                  <TrendStrip weekly={cat.weekly} currentWeek={block.progress.currentWeek} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-3">Categories are set up with a training block.</p>
        )}
      </CardBody>
    </Card>
  );
}

function GoalColumn({ horizon, goal, today, canEdit }: { horizon: (typeof V3_GOAL_HORIZONS)[number]; goal: V3GoalView | undefined; today: string; canEdit: boolean }) {
  const done = goal?.steps.filter((s) => s.doneAt).length ?? 0;
  const total = goal?.steps.length ?? 0;
  return (
    <div className="flex flex-col rounded-xl border border-line bg-surface-2/40 p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-accent">{horizon.name}</p>
      {goal ? (
        <>
          <h3 className="mt-1.5 text-base font-semibold leading-snug">{goal.title}</h3>
          {goal.detail ? <p className="mt-1 text-sm text-ink-3">{goal.detail}</p> : null}
          {goal.targetDate ? (
            <p className="mt-2 text-xs text-ink-2">
              Target: {dayWithYear(goal.targetDate)} <span className="text-ink-3">({relativeDay(goal.targetDate, today)})</span>
            </p>
          ) : null}
          <div className="mt-4 flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-ink-3">Action steps</p>
            {total > 0 ? (
              <p className="text-xs text-ink-3 tabular">
                {done}/{total} done
              </p>
            ) : null}
          </div>
          {total > 0 ? (
            <>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-3" aria-hidden>
                <div className="h-full rounded-full bg-good" style={{ width: `${(done / total) * 100}%` }} />
              </div>
              <ol className="mt-3 space-y-2.5">
                {goal.steps.map((s, i) => (
                  <StepToggle key={s.id} stepId={s.id} number={i + 1} text={s.text} done={Boolean(s.doneAt)} canEdit={canEdit} />
                ))}
              </ol>
            </>
          ) : (
            <p className="mt-1.5 text-sm text-ink-3">No action steps yet.</p>
          )}
        </>
      ) : (
        <p className="mt-1.5 text-sm text-ink-3">{horizon.hint} Not set yet.</p>
      )}
    </div>
  );
}

function GoalsCard({ plan, today, base, canEdit }: { plan: V3Plan; today: string; base: string; canEdit: boolean }) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader
        title="Goals & action steps"
        description="Two goals at most – the most pressing one and the longer-term one – with the steps to get there."
        action={<EditLink href={`${base}/goals`} />}
      />
      <CardBody className="grid gap-3 md:grid-cols-2">
        {V3_GOAL_HORIZONS.map((h) => (
          <GoalColumn key={h.key} horizon={h} goal={plan.goals[h.key]} today={today} canEdit={canEdit} />
        ))}
      </CardBody>
    </Card>
  );
}

const TIMELINE_ICON: Record<V3TimelineKind, typeof Flag> = {
  milestone: Flag,
  block_start: Play,
  block_end: CircleStop,
  review: Diamond,
  goal: Target,
};
const TIMELINE_TONE: Record<V3TimelineKind, string> = {
  milestone: "bg-surface-3 text-ink",
  block_start: "bg-surface-2 text-ink-3",
  block_end: "bg-surface-2 text-ink-3",
  review: "bg-practice-soft text-practice",
  goal: "bg-accent-soft text-accent",
};

function TimelineItem({ entry, today, past }: { entry: V3TimelineEntry; today: string; past: boolean }) {
  const Icon = TIMELINE_ICON[entry.kind];
  return (
    <li className={cn("relative flex gap-3 pb-4", past && "opacity-55")}>
      <span className={cn("relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full", TIMELINE_TONE[entry.kind])}>
        <Icon className="size-3.5" aria-hidden />
      </span>
      <div className="min-w-0 pt-0.5">
        <p className="text-xs text-ink-3 tabular">
          {dayWithYear(entry.date)}
          {!past ? <span> · {relativeDay(entry.date, today)}</span> : null}
        </p>
        <p className={cn("text-sm leading-snug", entry.kind === "milestone" || entry.kind === "goal" ? "font-semibold" : "font-medium")}>
          {entry.kind === "goal" ? "Goal: " : null}
          {entry.title}
        </p>
        {entry.detail ? <p className="text-xs text-ink-3">{entry.detail}</p> : null}
      </div>
    </li>
  );
}

function RoadmapCard({ plan, today, base }: { plan: V3Plan; today: string; base: string }) {
  const entries = buildV3Timeline({
    blocks: plan.blocks,
    milestones: plan.milestones,
    goals: Object.values(plan.goals).filter((g): g is V3GoalView => Boolean(g)),
  });
  const { past, upcoming, hiddenPast } = splitTimeline(entries, today, 2);
  return (
    <Card>
      <CardHeader title="Road map" description="Where this is heading – milestones, blocks, reviews and goal dates." action={<EditLink href={`${base}/roadmap`} />} />
      <CardBody>
        {entries.length === 0 ? (
          <EmptyState icon={Route} title="No road map yet" action={<ButtonLink href={`${base}/roadmap`} variant="secondary">Add milestones</ButtonLink>}>
            Trials, the start of the season, camps – the dates you&apos;re building towards.
          </EmptyState>
        ) : (
          <ol className="relative before:absolute before:bottom-4 before:left-3.5 before:top-2 before:w-px before:bg-line-strong">
            {hiddenPast > 0 ? <li className="pb-3 pl-10 text-xs text-ink-3">{hiddenPast} earlier</li> : null}
            {past.map((e, i) => (
              <TimelineItem key={`p${i}`} entry={e} today={today} past />
            ))}
            <li className="relative flex items-center gap-3 pb-4" aria-label="Today">
              <span className="relative z-10 flex size-7 shrink-0 items-center justify-center">
                <span className="size-3 rounded-full bg-ink ring-4 ring-canvas" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-ink">Today</span>
            </li>
            {upcoming.map((e, i) => (
              <TimelineItem key={`u${i}`} entry={e} today={today} past={false} />
            ))}
          </ol>
        )}
      </CardBody>
    </Card>
  );
}

const PHASE_BADGE = {
  current: { tone: "accent", label: "Current" },
  upcoming: { tone: "neutral", label: "Upcoming" },
  past: { tone: "neutral", label: "Finished" },
} as const;

function BlocksCard({ plan, base }: { plan: V3Plan; base: string }) {
  // Most recent first.
  const blocks = [...plan.blocks].reverse();
  return (
    <Card className="lg:col-span-3">
      <CardHeader
        title="Training blocks"
        description="Every block – when it starts, when it finishes, and what it focused on."
        action={
          <ButtonLink href={`${base}/blocks/new`} size="sm" variant="secondary">
            <Plus className="size-4" aria-hidden />
            New block
          </ButtonLink>
        }
      />
      <CardBody>
        {blocks.length === 0 ? (
          <EmptyState icon={Layers} title="No blocks yet" />
        ) : (
          <ul className="divide-y divide-line">
            {blocks.map((b) => {
              const badge = PHASE_BADGE[b.progress.phase];
              return (
                <li key={b.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`${base}/blocks/${b.id}`} className="font-medium hover:underline">
                        {b.name}
                      </Link>
                      <Badge tone={badge.tone}>{badge.label}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-ink-3">{b.categories.map((c) => c.name).join(" · ") || "No categories"}</p>
                  </div>
                  <p className="text-sm text-ink-2 tabular sm:text-right">
                    {day(b.startDate)} → {day(b.endDate)}
                    <span className="block text-xs text-ink-3">
                      {b.progress.totalWeeks} wk · {b.checkIns.length} check-in{b.checkIns.length === 1 ? "" : "s"} · {b.reviewPoints.length} review
                      {b.reviewPoints.length === 1 ? "" : "s"}
                    </span>
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

/** The whole V3 plan on one page – the same for the athlete and their coach. */
export function PlanView({ plan, today, base, viewerRole }: { plan: V3Plan; today: string; base: string; viewerRole: Role }) {
  return (
    <div className="space-y-4">
      {plan.isEmpty ? (
        <Card className="flex flex-col gap-3 border-practice-line p-5 sm:flex-row sm:items-center">
          <Compass className="size-5 shrink-0 text-practice" aria-hidden />
          <p className="flex-1 text-sm text-ink-2">
            Nothing set up yet. Start with the training block – dates, review points and up to {V3_MAX_CATEGORIES} categories – then add goals and the road
            map.
          </p>
          <ButtonLink href={`${base}/blocks/new`} size="sm">
            Set up a block
          </ButtonLink>
        </Card>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-3">
        <BlockCard plan={plan} today={today} base={base} viewerRole={viewerRole} />
        <IdentityCard plan={plan} base={base} />
        <CategoriesCard plan={plan} base={base} />
        <GoalsCard plan={plan} today={today} base={base} canEdit />
        <RoadmapCard plan={plan} today={today} base={base} />
        <BlocksCard plan={plan} base={base} />
      </div>
    </div>
  );
}
