import { daysBetween, formatDate } from "@/lib/dates";
import type { V3BlockView } from "@/lib/v3/data";

/**
 * The block as a bar: week dividers, a marker for each review point, and how
 * far through it today is.
 */
export function BlockTimelineBar({ block, today }: { block: V3BlockView; today: string }) {
  const totalDays = daysBetween(block.startDate, block.endDate) + 1;
  // Position of a date's midday along the bar, 0–100.
  const at = (date: string) => Math.min(100, Math.max(0, ((daysBetween(block.startDate, date) + 0.5) / totalDays) * 100));
  const weeks = block.progress.totalWeeks;
  const showToday = block.progress.phase === "current";

  return (
    <div>
      <div className="relative pt-5">
        {/* Review point labels sit above the bar. */}
        {block.reviewPoints.map((r) => (
          <span
            key={`${r.date}-${r.label}`}
            className="absolute top-0 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium text-practice"
            style={{ left: `${at(r.date)}%` }}
            aria-hidden
          >
            ◆
          </span>
        ))}
        <div className="relative h-3 overflow-hidden rounded-full bg-surface-3">
          <div className="absolute inset-y-0 left-0 rounded-full bg-practice/70" style={{ width: `${block.progress.fraction * 100}%` }} />
          {Array.from({ length: weeks - 1 }, (_, i) => (
            <span key={i} className="absolute inset-y-0 w-px bg-canvas/70" style={{ left: `${(((i + 1) * 7) / totalDays) * 100}%` }} aria-hidden />
          ))}
        </div>
        {showToday ? (
          <span
            className="absolute top-4 h-5 w-0.5 -translate-x-1/2 rounded-full bg-ink"
            style={{ left: `${at(today)}%` }}
            title="Today"
            aria-hidden
          />
        ) : null}
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-ink-3 tabular">
        <span>{formatDate(block.startDate, { weekday: "short", day: "numeric", month: "short" })}</span>
        <span>{formatDate(block.endDate, { weekday: "short", day: "numeric", month: "short" })}</span>
      </div>
    </div>
  );
}
