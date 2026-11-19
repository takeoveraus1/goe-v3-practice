import { ChevronRight, Diamond, MessageSquare, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { InviteCode } from "@/components/coach/invite-code";
import { Avatar, PageHeader } from "@/components/shell/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { TrendMark } from "@/components/v3/trend";
import { V3_VERSION_LABEL, v3ArchetypeName, v3ContextName, v3TrendName } from "@/config/v3";
import { requireCoach } from "@/lib/auth/dal";
import { cn } from "@/lib/cn";
import { addDays, formatDate, relativeDay } from "@/lib/dates";
import { today as getToday } from "@/lib/today";
import { getV3Roster, type V3Plan } from "@/lib/v3/data";

export const metadata: Metadata = { title: "Athletes" };

const day = (iso: string) => formatDate(iso, { weekday: "short", day: "numeric", month: "short" });
const REVIEW_WINDOW_DAYS = 21;
/** Older check-ins without feedback drop off the "waiting" list. */
const FEEDBACK_WINDOW_DAYS = 14;

function checkInLabel(plan: V3Plan, today: string): { text: string; warn: boolean } {
  const block = plan.currentBlock;
  if (!block) return { text: plan.nextBlock ? `Next block starts ${relativeDay(plan.nextBlock.startDate, today)}` : "No block running", warn: !plan.nextBlock };
  const s = block.checkInStatus;
  if (block.missedWeeks.length) return { text: `Missed check-in: week ${block.missedWeeks.join(", ")}`, warn: true };
  if (s.kind === "open") return { text: s.dueToday ? `Week ${s.week} check-in due today` : `Week ${s.week} check-in due ${day(s.dueDate)}`, warn: s.dueToday };
  if (s.kind === "done") return { text: `Week ${s.week} checked in ✓`, warn: false };
  return { text: "", warn: false };
}

export default async function V3CoachHome() {
  const coach = await requireCoach();
  const today = await getToday();
  const roster = await getV3Roster(coach.id, today);

  const windowEnd = addDays(today, REVIEW_WINDOW_DAYS);
  const feedbackSince = addDays(today, -FEEDBACK_WINDOW_DAYS);
  const reviews = roster
    .flatMap((plan) =>
      plan.blocks.flatMap((block) =>
        block.reviewPoints.filter((r) => r.date >= today && r.date <= windowEnd).map((review) => ({ plan, block, review })),
      ),
    )
    .sort((a, b) => (a.review.date < b.review.date ? -1 : 1));
  const toRead = roster
    .flatMap((plan) =>
      plan.blocks.flatMap((block) =>
        block.checkIns.filter((c) => !c.coachFeedback && c.date >= feedbackSince).map((checkIn) => ({ plan, block, checkIn })),
      ),
    )
    .sort((a, b) => (a.checkIn.date < b.checkIn.date ? 1 : -1));

  return (
    <>
      <PageHeader
        eyebrow={V3_VERSION_LABEL}
        title="Your athletes"
        description="Each athlete's training block, what they're working on, how it's trending, and what's coming up."
      />

      {coach.inviteCode ? (
        <Card className="mb-4">
          <CardHeader title="Invite athletes" description="Athletes enter this code when they sign up (or on their plan page) to join your roster." />
          <CardBody>
            <InviteCode code={coach.inviteCode} />
          </CardBody>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Review points coming up" description={`Next ${REVIEW_WINDOW_DAYS} days`} />
          <CardBody>
            {reviews.length === 0 ? (
              <p className="text-sm text-ink-3">No reviews in the next three weeks.</p>
            ) : (
              <ul className="space-y-2">
                {reviews.map(({ plan, block, review }) => (
                  <li key={`${block.id}-${review.date}-${review.label}`}>
                    <Link
                      href={`/coach/athletes/${plan.athlete.id}`}
                      className="flex items-center gap-3 rounded-lg bg-surface-2/70 px-3 py-2 text-sm hover:bg-surface-3"
                    >
                      <Diamond className="size-4 shrink-0 text-practice" aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="font-medium text-ink">{plan.athlete.name}</span>
                        <span className="block truncate text-xs text-ink-3">
                          {review.label} · {block.name}
                        </span>
                      </span>
                      <span className="shrink-0 text-right text-xs text-ink-2 tabular">
                        {day(review.date)}
                        <span className="block text-ink-3">{relativeDay(review.date, today)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Check-ins waiting for feedback" description={`Last ${FEEDBACK_WINDOW_DAYS} days`} />
          <CardBody>
            {toRead.length === 0 ? (
              <p className="text-sm text-ink-3">You&apos;re all caught up.</p>
            ) : (
              <ul className="space-y-2">
                {toRead.slice(0, 6).map(({ plan, block, checkIn }) => (
                  <li key={checkIn.id}>
                    <Link
                      href={`/coach/athletes/${plan.athlete.id}/check-ins`}
                      className="flex items-center gap-3 rounded-lg bg-warn-soft px-3 py-2 text-sm hover:brightness-125"
                    >
                      <MessageSquare className="size-4 shrink-0 text-warn" aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="font-medium text-ink">{plan.athlete.name}</span>
                        <span className="block truncate text-xs text-ink-2">
                          Week {checkIn.weekNumber} · {block.name}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-ink-3">{relativeDay(checkIn.date, today)}</span>
                      <ChevronRight className="size-4 text-ink-3" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <h2 className="mb-3 mt-8 text-sm font-semibold text-ink-2">
        Roster <span className="text-ink-3">({roster.length})</span>
      </h2>
      {roster.length === 0 ? (
        <Card>
          <EmptyState icon={Users} title="No athletes yet">
            Share your invite code above. Athletes appear here as soon as they join.
          </EmptyState>
        </Card>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {roster.map((plan) => {
            const block = plan.currentBlock ?? plan.nextBlock;
            const primary = v3ArchetypeName(plan.profile?.primaryArchetype);
            const secondary = v3ArchetypeName(plan.profile?.secondaryArchetype);
            const status = checkInLabel(plan, today);
            const steps = Object.values(plan.goals).flatMap((g) => g?.steps ?? []);
            const stepsDone = steps.filter((s) => s.doneAt).length;
            const aim = [plan.profile?.aimRole, plan.profile?.aimTeam].filter(Boolean).join(", ");
            return (
              <li key={plan.athlete.id}>
                <Link
                  href={`/coach/athletes/${plan.athlete.id}`}
                  className="flex h-full flex-col rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-line-strong hover:bg-surface-2/40"
                >
                  <div className="flex items-start gap-3">
                    <Avatar name={plan.athlete.name} className="size-10 text-sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{plan.athlete.name}</p>
                      <p className="truncate text-xs text-ink-3">{primary ? `${primary}${secondary ? ` / ${secondary}` : ""}` : "Archetype not set"}</p>
                    </div>
                    {plan.currentBlock ? (
                      <p className="text-right text-lg font-semibold leading-none tabular">
                        Wk {plan.currentBlock.progress.currentWeek}
                        <span className="text-sm font-normal text-ink-3">/{plan.currentBlock.progress.totalWeeks}</span>
                      </p>
                    ) : null}
                  </div>

                  {plan.profile?.contexts.length ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {plan.profile.contexts.map((c) => (
                        <Badge key={c} tone="accent">
                          {v3ContextName(c)}
                        </Badge>
                      ))}
                    </div>
                  ) : null}

                  {block ? (
                    <div className="mt-4 rounded-xl bg-surface-2/60 p-3">
                      <p className="text-sm font-medium">
                        {block.name}
                        <span className="font-normal text-ink-3">
                          {" "}
                          · {day(block.startDate)} → {day(block.endDate)}
                        </span>
                      </p>
                      <ul className="mt-2 space-y-1">
                        {block.categories.map((cat) => (
                          <li key={cat.id} className="flex items-center gap-2 text-sm">
                            <TrendMark trend={cat.latest} size="sm" label={`${cat.name}, latest week: ${cat.latest ? v3TrendName(cat.latest) : "not rated yet"}`} />
                            <span className="truncate text-ink-2">{cat.name}</span>
                          </li>
                        ))}
                      </ul>
                      {block.nextReview ? (
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-3">
                          <Diamond className="size-3 text-practice" aria-hidden />
                          {block.nextReview.label} {relativeDay(block.nextReview.date, today)}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mt-4 rounded-xl border border-dashed border-line-strong p-3 text-sm text-ink-3">No training block set up yet.</p>
                  )}

                  <dl className="mt-3 space-y-1 text-xs">
                    <div className="flex gap-1.5">
                      <dt className="shrink-0 font-medium text-accent">Roadmap:</dt>
                      <dd className="line-clamp-2 text-ink-3">
                        {aim ? `${aim}${plan.profile?.aimYear ? ` (by ${plan.profile.aimYear})` : ""}` : "not set yet"}
                      </dd>
                    </div>
                    <div className="flex gap-1.5">
                      <dt className="shrink-0 font-medium text-accent">Action steps:</dt>
                      <dd className="text-ink-3 tabular">{steps.length ? `${stepsDone}/${steps.length} done` : "none yet"}</dd>
                    </div>
                  </dl>
                  {status.text ? <p className={cn("mt-auto pt-3 text-xs", status.warn ? "text-warn" : "text-ink-3")}>{status.text}</p> : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
