import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { v3TrendName, type V3Trend } from "@/config/v3";
import { cn } from "@/lib/cn";

export const TREND_ICON: Record<V3Trend, typeof ArrowUpRight> = { up: ArrowUpRight, same: ArrowRight, down: ArrowDownRight };

export const TREND_TONE: Record<V3Trend, string> = {
  up: "text-good bg-good-soft",
  same: "text-ink-2 bg-surface-3",
  down: "text-bad bg-bad-soft",
};

export function TrendBadge({ trend, className }: { trend: V3Trend | null; className?: string }) {
  if (!trend) {
    return <span className={cn("inline-flex items-center rounded-full bg-surface-2 px-2.5 py-0.5 text-xs text-ink-3", className)}>No check-in yet</span>;
  }
  const Icon = TREND_ICON[trend];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", TREND_TONE[trend], className)}>
      <Icon className="size-3.5" aria-hidden />
      {v3TrendName(trend)}
    </span>
  );
}

/** A small square per week: ↗ → ↘, or empty for weeks without a check-in. */
export function TrendStrip({
  weekly,
  currentWeek,
}: {
  weekly: ReadonlyArray<{ week: number; trend: V3Trend | null }>;
  currentWeek?: number | null;
}) {
  return (
    <ol className="flex flex-wrap gap-1.5" aria-label="Week by week">
      {weekly.map(({ week, trend }) => {
        const Icon = trend ? TREND_ICON[trend] : null;
        return (
          <li key={week} className="flex flex-col items-center gap-1">
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-lg border",
                trend ? cn(TREND_TONE[trend], "border-transparent") : "border-dashed border-line-strong text-ink-3",
                week === currentWeek && !trend ? "border-practice-line" : null,
              )}
              title={`Week ${week}: ${trend ? v3TrendName(trend) : "no check-in"}`}
            >
              {Icon ? <Icon className="size-4" aria-hidden /> : null}
              <span className="sr-only">
                Week {week}: {trend ? v3TrendName(trend) : "no check-in"}
              </span>
            </span>
            <span className={cn("text-[10px] tabular", week === currentWeek ? "font-semibold text-practice" : "text-ink-3")} aria-hidden>
              W{week}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
