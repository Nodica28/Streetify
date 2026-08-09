import { CATEGORY_KEYS, CATEGORY_META, type CategoryKey } from "@/lib/types";

interface Props {
  counts: Record<CategoryKey, number>;
}

export function CategoryBreakdown({ counts }: Props) {
  const max = Math.max(1, ...Object.values(counts));
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h3 className="kicker">Category breakdown</h3>
        <p className="font-mono text-xs text-muted-foreground">
          {total} within 1 km
        </p>
      </div>
      <ul className="space-y-2.5">
        {CATEGORY_KEYS.map((key) => {
          const meta = CATEGORY_META[key];
          const count = counts[key] ?? 0;
          const pct = Math.round((count / max) * 100);
          return (
            <li key={key} className="grid grid-cols-[100px_1fr_auto] items-center gap-3">
              <span className="text-xs font-medium text-foreground/85">{meta.label}</span>
              <div className="relative h-2 overflow-hidden rounded-sm bg-muted">
                <div
                  className="h-full rounded-sm transition-all duration-700"
                  style={{
                    width: `${count === 0 ? 0 : Math.max(2, pct)}%`,
                    backgroundColor: `hsl(var(${meta.colorVar}))`,
                  }}
                />
              </div>
              <span className="w-8 text-right font-mono text-xs tabular-nums text-muted-foreground">
                {count}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
