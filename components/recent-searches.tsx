"use client";

import * as React from "react";
import Link from "next/link";
import { Clock, Trash2 } from "lucide-react";
import { readHistory, clearHistory, type HistoryItem } from "@/lib/history";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const EXAMPLES: Array<{ address: string; hint: string }> = [
  { address: "Times Square, New York", hint: "Urban" },
  { address: "1600 Amphitheatre Parkway, Mountain View, CA", hint: "Suburban" },
  { address: "Wall Drug, Wall, South Dakota", hint: "Rural" },
];

export function RecentSearches({ onExampleClick }: { onExampleClick?: (address: string) => void }) {
  const [history, setHistory] = React.useState<HistoryItem[] | null>(null);

  React.useEffect(() => {
    setHistory(readHistory());
    const onStorage = () => setHistory(readHistory());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (history === null) {
    return <div aria-hidden className="h-12" />;
  }

  if (history.length === 0) {
    return (
      <div className="space-y-3">
        <div className="kicker flex items-center gap-2">
          <span>Try a starting point</span>
          <span className="rule flex-1" />
        </div>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.address}
              type="button"
              onClick={() => onExampleClick?.(ex.address)}
              className="group inline-flex items-center gap-2 rounded-sm border border-border bg-card px-3 py-2 text-sm transition-colors hover:border-foreground"
            >
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground group-hover:text-accent">
                {ex.hint}
              </span>
              <span className="text-foreground/85">{ex.address}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="kicker">Recent searches on this device</span>
        <span className="rule flex-1" />
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => {
            clearHistory();
            setHistory([]);
          }}
        >
          <Trash2 className="h-3 w-3" />
          Clear
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {history.map((h) => (
          <Link
            key={h.slug}
            href={`/a/${h.slug}`}
            className="group inline-flex items-center gap-2 rounded-sm border border-border bg-card px-3 py-1.5 text-sm transition-colors hover:border-foreground"
          >
            <span className="font-mono text-[11px] font-medium text-accent">{h.walk_score}</span>
            <span className="line-clamp-1 max-w-[280px] text-foreground/85">{h.address}</span>
            <span
              className={cn(
                "rounded-sm border border-transparent px-1.5 py-0.5 text-[9px] uppercase tracking-widest",
                h.urban_label === "urban" && "bg-cat-transit/15 text-cat-transit",
                h.urban_label === "suburban" && "bg-cat-park/15 text-cat-park",
                h.urban_label === "rural" && "bg-muted text-muted-foreground",
              )}
            >
              {h.urban_label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
