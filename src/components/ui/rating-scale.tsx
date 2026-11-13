import { cn } from "@/lib/cn";
import { FieldError } from "./field";

/** A 1–10 scale as a row of radio buttons – tappable on mobile, works without JavaScript. */
export function RatingScale({
  name,
  label,
  description,
  lowLabel = "Low",
  highLabel = "High",
  error,
  defaultValue,
  max = 10,
}: {
  name: string;
  label: string;
  description?: string;
  lowLabel?: string;
  highLabel?: string;
  error?: string;
  defaultValue?: number;
  max?: number;
}) {
  return (
    <fieldset aria-describedby={error ? `${name}-error` : undefined}>
      <legend className="text-sm font-medium text-ink-2">{label}</legend>
      {description ? <p className="mt-0.5 text-xs text-ink-3">{description}</p> : null}
      <div className="mt-2 grid grid-cols-10 gap-1 sm:gap-1.5">
        {Array.from({ length: max }, (_, i) => i + 1).map((value) => (
          <label key={value} className="relative">
            <input
              type="radio"
              name={name}
              value={value}
              defaultChecked={defaultValue === value}
              className="peer sr-only"
              aria-label={`${label}: ${value} out of ${max}`}
            />
            <span
              className={cn(
                "flex h-10 cursor-pointer items-center justify-center rounded-lg border text-sm font-medium tabular transition-colors",
                "border-line-strong bg-surface-2 text-ink-2 hover:border-ink-3",
                "peer-checked:border-accent peer-checked:bg-accent peer-checked:text-on-accent",
                "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent",
              )}
              aria-hidden
            >
              {value}
            </span>
          </label>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-ink-3" aria-hidden>
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
      <FieldError id={`${name}-error`}>{error}</FieldError>
    </fieldset>
  );
}
