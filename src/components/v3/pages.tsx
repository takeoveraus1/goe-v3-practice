import { ChevronLeft, NotebookPen } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { Role } from "@/db/schema";
import { addDays, formatDate } from "@/lib/dates";
import { today as getToday } from "@/lib/today";
import { v3StartedWeeks, v3WeekRange } from "@/lib/v3/blocks";
import { getV3Plan } from "@/lib/v3/data";
import { CheckInHistory } from "./check-in-history";
import { V3BlockForm, type V3BlockDefaults } from "./forms/block-form";
import { V3CheckInForm } from "./forms/check-in-form";
import { DeleteBlockButton } from "./forms/delete-block-button";
import { V3GoalsForm, type V3GoalDefaults } from "./forms/goals-form";
import { V3ProfileForm } from "./forms/profile-form";
import { V3RoadmapForm } from "./forms/roadmap-form";
import { CheckInStatusLine, PlanView } from "./plan-view";
import { SavedNotice } from "./saved-notice";

/**
 * Page bodies shared by the athlete's routes (/athlete/…) and the coach's
 * (/coach/athletes/[id]/…). Callers check access before rendering these.
 */

interface BodyProps {
  athleteId: string;
  /** The plan page for this athlete in the viewer's area. */
  base: string;
}

async function loadPlan(athleteId: string) {
  const today = await getToday();
  const plan = await getV3Plan(athleteId, today);
  if (!plan) notFound();
  return { plan, today };
}

function EditHeader({ base, title, description, action }: { base: string; title: string; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6">
      <Link href={base} className="inline-flex items-center gap-1 text-sm text-ink-3 hover:text-ink">
        <ChevronLeft className="size-4" aria-hidden />
        Back to the plan
      </Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description ? <p className="mt-1 max-w-2xl text-sm text-ink-3">{description}</p> : null}
        </div>
        {action}
      </div>
    </div>
  );
}

export async function PlanBody({ athleteId, base, viewerRole, saved, header }: BodyProps & { viewerRole: Role; saved?: string | string[]; header?: (plan: Awaited<ReturnType<typeof loadPlan>>) => ReactNode }) {
  const loaded = await loadPlan(athleteId);
  return (
    <>
      {header ? header(loaded) : null}
      <SavedNotice saved={saved} />
      <PlanView plan={loaded.plan} today={loaded.today} base={base} viewerRole={viewerRole} />
    </>
  );
}

export async function ProfileEditBody({ athleteId, base }: BodyProps) {
  const { plan } = await loadPlan(athleteId);
  return (
    <>
      <EditHeader base={base} title="Archetype & context" description="Labels only – there are no weights, categories or scores underneath an archetype in this version." />
      <V3ProfileForm
        athleteId={athleteId}
        cancelHref={base}
        defaults={{
          primaryArchetype: plan.profile?.primaryArchetype ?? null,
          secondaryArchetype: plan.profile?.secondaryArchetype ?? null,
          contexts: plan.profile?.contexts ?? [],
          contextNote: plan.profile?.contextNote ?? null,
        }}
      />
    </>
  );
}

export async function GoalsEditBody({ athleteId, base }: BodyProps) {
  const { plan } = await loadPlan(athleteId);
  const defaults: Record<string, V3GoalDefaults> = {};
  for (const goal of Object.values(plan.goals)) {
    if (!goal) continue;
    defaults[goal.horizon] = {
      title: goal.title,
      detail: goal.detail,
      targetDate: goal.targetDate,
      steps: goal.steps.map((s) => ({ id: s.id, text: s.text, done: Boolean(s.doneAt) })),
    };
  }
  return (
    <>
      <EditHeader base={base} title="Goals & action steps" description="Two goals at most: the most pressing one and the longer-term one. Break each into steps, in order." />
      <V3GoalsForm athleteId={athleteId} cancelHref={base} defaults={defaults} />
    </>
  );
}

export async function RoadmapEditBody({ athleteId, base }: BodyProps) {
  const { plan } = await loadPlan(athleteId);
  return (
    <>
      <EditHeader base={base} title="Road map" description="The anticipated road ahead. Add the dates that matter; blocks, review points and goal dates are filled in for you." />
      <V3RoadmapForm athleteId={athleteId} cancelHref={base} defaults={plan.milestones.map((m) => ({ date: m.date, title: m.title, detail: m.detail }))} />
    </>
  );
}

export async function BlockEditBody({ athleteId, base, blockId }: BodyProps & { blockId: string | null }) {
  const { plan, today } = await loadPlan(athleteId);

  if (blockId) {
    const block = plan.blocks.find((b) => b.id === blockId);
    if (!block) notFound();
    const defaults: V3BlockDefaults = {
      id: block.id,
      name: block.name,
      startDate: block.startDate,
      endDate: block.endDate,
      notes: block.notes,
      reviewPoints: block.reviewPoints,
      categories: block.categories.map((c) => ({ id: c.id, name: c.name, detail: c.detail })),
    };
    return (
      <>
        <EditHeader base={base} title={`Edit ${block.name}`} action={<DeleteBlockButton athleteId={athleteId} blockId={block.id} name={block.name} />} />
        <V3BlockForm athleteId={athleteId} defaults={defaults} cancelHref={base} />
      </>
    );
  }

  // A new block starts the day after the last one finishes (or today), and runs four weeks.
  const last = plan.blocks.at(-1);
  const dayAfterLast = last ? addDays(last.endDate, 1) : today;
  const startDate = dayAfterLast > today ? dayAfterLast : today;
  const defaults: V3BlockDefaults = {
    id: null,
    name: "",
    startDate,
    endDate: addDays(startDate, 27),
    notes: null,
    reviewPoints: [],
    categories: last ? last.categories.map((c) => ({ id: null, name: c.name, detail: c.detail })) : [],
  };
  return (
    <>
      <EditHeader base={base} title="New training block" description="When it starts, when it finishes, when it gets reviewed, and up to four things to work on." />
      <V3BlockForm athleteId={athleteId} defaults={defaults} cancelHref={base} carriedFrom={last?.name ?? null} />
    </>
  );
}

export async function CheckInsBody({ athleteId, viewerRole, saved }: BodyProps & { viewerRole: Role; saved?: string | string[] }) {
  const { plan, today } = await loadPlan(athleteId);
  const block = plan.currentBlock;
  return (
    <>
      <SavedNotice saved={saved} />
      {block ? (
        <Card className="mb-6 flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
          <NotebookPen className="size-5 shrink-0 text-practice" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">
              {block.name} · week {block.progress.currentWeek} of {block.progress.totalWeeks}
            </p>
            <div className="mt-0.5">
              <CheckInStatusLine block={block} today={today} />
            </div>
          </div>
          {viewerRole === "athlete" ? (
            <ButtonLink href="/athlete/check-ins/new" variant={block.checkInStatus.kind === "open" ? "primary" : "secondary"}>
              {block.checkInStatus.kind === "open" ? `Check in for week ${block.checkInStatus.week}` : "Open check-in"}
            </ButtonLink>
          ) : null}
        </Card>
      ) : null}
      <CheckInHistory blocks={plan.blocks} viewerRole={viewerRole} />
    </>
  );
}

/** The athlete's own check-in form for the current block (or the one that just finished). */
export async function NewCheckInBody({ athleteId, requestedWeek }: { athleteId: string; requestedWeek?: string | string[] }) {
  const { plan, today } = await loadPlan(athleteId);
  // Allow catching up on the last week for 7 days after a block finishes.
  const block = plan.currentBlock ?? [...plan.blocks].reverse().find((b) => b.progress.phase === "past" && b.endDate >= addDays(today, -7)) ?? null;

  if (!block) {
    return (
      <>
        <EditHeader base="/athlete/check-ins" title="Weekly check-in" />
        <Card>
          <EmptyState icon={NotebookPen} title="No training block running" action={<ButtonLink href="/athlete/blocks/new">Set up a block</ButtonLink>}>
            {plan.nextBlock
              ? `Check-ins start when ${plan.nextBlock.name} does (${formatDate(plan.nextBlock.startDate, { weekday: "short", day: "numeric", month: "short" })}).`
              : "Check-ins happen during a training block."}
          </EmptyState>
        </Card>
      </>
    );
  }

  const started = v3StartedWeeks(block, today);
  const doneWeeks = new Set(block.checkIns.map((c) => c.weekNumber));
  const weeks = Array.from({ length: started }, (_, i) => {
    const week = i + 1;
    const range = v3WeekRange(block, week);
    return { week, label: `${formatDate(range.from)} – ${formatDate(range.to)}`, done: doneWeeks.has(week) };
  });
  const asked = Number(typeof requestedWeek === "string" ? requestedWeek : NaN);
  const status = block.checkInStatus;
  const defaultWeek = Number.isInteger(asked) && asked >= 1 && asked <= started ? asked : status.kind === "open" ? status.week : started;

  return (
    <>
      <EditHeader base="/athlete/check-ins" title="Weekly check-in" description="Once a week: is each thing you're working on trending up, staying the same, or trending down?" />
      <V3CheckInForm
        blockId={block.id}
        blockName={block.name}
        weeks={weeks}
        defaultWeek={defaultWeek}
        categories={block.categories.map((c) => ({ id: c.id, name: c.name, detail: c.detail }))}
        existing={block.checkIns.map((c) => ({ weekNumber: c.weekNumber, notes: c.notes, trends: c.trends }))}
      />
    </>
  );
}
