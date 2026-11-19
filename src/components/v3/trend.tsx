import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { V3_TRENDS, v3TrendName, type V3Trend } from "@/config/v3";
import { cn } from "@/lib/cn";

/**
 * The one way a weekly rating is shown anywhere in the app: the same arrow,
 * colour and shape on the dashboard, in check-in history and on coach screens.
 */
export const TREND_ICON: Record<V3Trend, typeof ArrowUpRight> = { up: ArrowUpRight, same: ArrowRight, down: ArrowDownRight };

export const TREND_TONE: Record<V3Trend, string> = {
  up: "text-good bg-good-soft",
  same: "text-ink-2 bg-surface-3",
  down: "text-bad bg-bad-soft",
};

/** A rating square. Empty (dashed) when there's no rating for that week yet; `current` outlines this week's. */
export function TrendMark({
  trend,
  size = "md",
  label,
  current = false,
}: {
  trend: V3Trend | null;
  size?: "sm" | "md";
  /** Accessible name; defaults to the rating's name. */
  label?: string;
  current?: boolean;
}) {
  const Icon = trend ? TREND_ICON[trend] : null;
  const name = label ?? (trend ? v3TrendName(trend) : "Not rated yet");
  return (
    <span
      role="img"
      aria-label={name}
      title={name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md",
        size === "sm" ? "size-5" : "size-8",
        trend ? TREND_TONE[trend] : "border border-dashed border-line-strong",
        current && !trend && "border-practice-line",
      )}
    >
      {Icon ? <Icon className={size === "sm" ? "size-3.5" : "size-4"} aria-hidden /> : null}
    </span>
  );
}

/** A rating with its name next to it, for lists. */
export function TrendWithLabel({ trend }: { trend: V3Trend | null }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <TrendMark trend={trend} size="sm" />
      <span className={trend ? "text-ink-2" : "text-ink-3"}>{trend ? v3TrendName(trend) : "Not rated"}</span>
    </span>
  );
}

export function TrendLegend() {
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-3" aria-hidden>
      {V3_TRENDS.map((t) => (
        <span key={t.key} className="inline-flex items-center gap-1.5">
          <TrendMark trend={t.key} size="sm" />
          {t.name}
        </span>
      ))}
    </p>
  );
}
