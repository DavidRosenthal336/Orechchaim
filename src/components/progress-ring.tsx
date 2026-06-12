import { cn } from "@/lib/utils";

/// A quiet circular progress indicator toward the day's target.
export function ProgressRing({
  value,
  max,
  size = 96,
  stroke = 9,
  className,
}: {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  className?: string;
}) {
  const safeMax = Math.max(max, 1);
  const frac = Math.min(value / safeMax, 1);
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - frac);
  const met = max > 0 && value >= max;
  const color = met ? "var(--positive)" : "var(--accent)";

  return (
    <div
      className={cn("relative", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--surface-2)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 300ms ease, stroke 300ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold leading-none tabular-nums">
          {value}
        </span>
        {max > 0 ? (
          <span className="mt-0.5 text-xs text-muted">of {max}</span>
        ) : null}
      </div>
    </div>
  );
}
