// LocalStorage helpers for recent searches. Per-device, per the brief.

const KEY = "streetify:history:v1";
const MAX = 8;

export interface HistoryItem {
  slug: string;
  address: string;
  walk_score: number;
  drive_score: number;
  urban_label: string;
  ts: number;
}

export function readHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValid).slice(0, MAX);
  } catch {
    return [];
  }
}

export function pushHistory(item: HistoryItem): HistoryItem[] {
  if (typeof window === "undefined") return [];
  const existing = readHistory().filter((h) => h.slug !== item.slug);
  const next = [{ ...item, ts: Date.now() }, ...existing].slice(0, MAX);
  window.localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

function isValid(x: unknown): x is HistoryItem {
  return (
    typeof x === "object" &&
    x !== null &&
    typeof (x as HistoryItem).slug === "string" &&
    typeof (x as HistoryItem).address === "string" &&
    typeof (x as HistoryItem).walk_score === "number" &&
    typeof (x as HistoryItem).drive_score === "number"
  );
}
