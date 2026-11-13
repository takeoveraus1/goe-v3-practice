import { MessageSquare, NotebookPen } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { Role } from "@/db/schema";
import { formatDate } from "@/lib/dates";
import type { V3BlockView } from "@/lib/v3/data";
import { v3WeekRange } from "@/lib/v3/blocks";
import { V3FeedbackForm } from "./feedback-form";
import { TrendBadge } from "./trend";

const day = (iso: string) => formatDate(iso, { weekday: "short", day: "numeric", month: "short" });

/** Every weekly check-in, newest block and week first, with the coach's feedback. */
export function CheckInHistory({ blocks, viewerRole }: { blocks: V3BlockView[]; viewerRole: Role }) {
  const withCheckIns = [...blocks].reverse().filter((b) => b.checkIns.length > 0);
  if (withCheckIns.length === 0) {
    return (
      <Card>
        <EmptyState icon={NotebookPen} title="No check-ins yet">
          Once a week, rate each category: trending up, staying the same, or trending down.
        </EmptyState>
      </Card>
    );
  }
  return (
    <div className="space-y-8">
      {withCheckIns.map((block) => (
        <section key={block.id}>
          <h2 className="mb-3 text-sm font-semibold text-ink-2">
            {block.name}{" "}
            <span className="font-normal text-ink-3">
              · {day(block.startDate)} → {day(block.endDate)}
            </span>
          </h2>
          <ul className="space-y-3">
            {[...block.checkIns].reverse().map((checkIn) => {
              const range = v3WeekRange(block, checkIn.weekNumber);
              return (
                <li key={checkIn.id}>
                  <Card>
                    <CardBody className="space-y-4">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h3 className="font-semibold">Week {checkIn.weekNumber}</h3>
                        <p className="text-xs text-ink-3">
                          {day(range.from)} – {day(range.to)} · checked in {day(checkIn.date)}
                        </p>
                      </div>
                      <ul className="divide-y divide-line rounded-xl border border-line">
                        {block.categories.map((cat) => {
                          const t = checkIn.trends.find((x) => x.categoryId === cat.id);
                          return (
                            <li key={cat.id} className="flex flex-col gap-1.5 px-3 py-2.5 sm:flex-row sm:items-start sm:gap-4">
                              <p className="text-sm font-medium sm:w-56 sm:shrink-0">{cat.name}</p>
                              <div className="min-w-0 flex-1 space-y-1">
                                <TrendBadge trend={t?.trend ?? null} />
                                {t?.note ? <p className="text-sm text-ink-2">{t.note}</p> : null}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                      {checkIn.notes ? <p className="whitespace-pre-line text-sm text-ink-2">{checkIn.notes}</p> : null}
                      {checkIn.coachFeedback ? (
                        <div className="rounded-xl border border-accent/30 bg-accent-soft/50 p-3">
                          <p className="flex items-center gap-1.5 text-xs font-medium text-accent">
                            <MessageSquare className="size-3.5" aria-hidden />
                            Coach feedback
                          </p>
                          <p className="mt-1 whitespace-pre-line text-sm text-ink">{checkIn.coachFeedback}</p>
                        </div>
                      ) : null}
                      {viewerRole === "coach" ? <V3FeedbackForm checkInId={checkIn.id} current={checkIn.coachFeedback} /> : null}
                    </CardBody>
                  </Card>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
