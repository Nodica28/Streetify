import { cn } from "@/lib/utils";

interface ScoreCardProps {
  kicker: string;
  score: number;
  label: string;
  helper: string;
  className?: string;
}

const CIRC = 2 * Math.PI * 45; // r=45

export function ScoreCard({ kicker, score, label, helper, className }: ScoreCardProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const offset = CIRC * (1 - clamped / 100);
  const testId = `score-${kicker.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div
      className={cn("group relative overflow-hidden rounded-sm border border-border bg-card p-5", className)}
      data-testid={testId}
    >
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1 min-w-0">
          <p className="kicker">{kicker}</p>
          <p
            className="mt-2 font-mono text-6xl font-bold leading-none tracking-tight tabular-nums"
            data-testid={`${testId}-value`}
          >
            {clamped}
            <span className="text-xl align-top text-muted-foreground/60">/100</span>
          </p>
          <p className="mt-3 text-sm font-medium text-foreground">{label}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{helper}</p>
        </div>
        <div className="relative h-24 w-24 shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="4"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="hsl(var(--accent))"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.16, 1, 0.3, 1)" }}
            />
          </svg>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="font-mono text-xs font-medium text-muted-foreground">{clamped}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function UrbanCard({ label, density, count }: { label: string; density: number; count: number }) {
  const swatch: Record<string, string> = {
    urban: "bg-cat-transit",
    suburban: "bg-cat-park",
    rural: "bg-muted",
  };
  return (
    <div className="relative overflow-hidden rounded-sm border border-border bg-card p-5" data-testid="urban-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="kicker">Urban Index</p>
          <p className="mt-2 font-display text-4xl font-semibold capitalize tracking-tight" data-testid="urban-label">
            {label}
          </p>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            <span className="font-mono tabular-nums text-foreground">{count}</span> amenities inside the
            walking radius, <span className="font-mono tabular-nums text-foreground">{density}</span>/km².
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div className={cn("h-16 w-2 rounded-sm", swatch[label] ?? "bg-muted")} />
          <div className={cn("h-8 w-2 rounded-sm opacity-60", swatch[label] ?? "bg-muted")} />
          <div className={cn("h-4 w-2 rounded-sm opacity-30", swatch[label] ?? "bg-muted")} />
        </div>
      </div>
    </div>
  );
}
