"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, MapPin, Search } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Suggestion {
  place_id: number;
  display_name: string;
  lat: number;
  lng: number;
}

interface AddressSearchProps {
  autoFocus?: boolean;
  size?: "hero" | "compact";
  className?: string;
  placeholder?: string;
  initialValue?: string;
}

export function AddressSearch({
  autoFocus,
  size = "hero",
  className,
  placeholder = "Type a street address…",
  initialValue = "",
}: AddressSearchProps) {
  const router = useRouter();
  const [value, setValue] = React.useState(initialValue);
  const [open, setOpen] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<Suggestion[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [highlighted, setHighlighted] = React.useState(0);
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    if (value.trim().length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const t = setTimeout(() => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setLoading(true);
      fetch(`/api/suggest?q=${encodeURIComponent(value.trim())}`, { signal: ac.signal })
        .then((r) => r.json())
        .then((data) => {
          setSuggestions(data.results ?? []);
          setOpen(true);
          setHighlighted(0);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 220);
    return () => clearTimeout(t);
  }, [value]);

  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function submitAddress(address: string) {
    if (!address.trim() || submitting) return;
    setSubmitting(true);
    setOpen(false);
    try {
      const res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Lookup failed");
        setSubmitting(false);
        return;
      }
      router.push(`/a/${data.slug}`);
    } catch (err) {
      toast.error("Network error. Try again.");
      setSubmitting(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" && open && suggestions.length) {
      e.preventDefault();
      setHighlighted((h) => (h + 1) % suggestions.length);
    } else if (e.key === "ArrowUp" && open && suggestions.length) {
      e.preventDefault();
      setHighlighted((h) => (h - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && suggestions[highlighted]) {
        submitAddress(suggestions[highlighted].display_name);
      } else if (value.trim()) {
        submitAddress(value);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (suggestions[highlighted] && open) submitAddress(suggestions[highlighted].display_name);
          else submitAddress(value);
        }}
        className={cn(
          "group relative flex items-stretch border border-border bg-card shadow-sm transition-all focus-within:border-foreground",
          size === "hero" ? "h-16 rounded-sm" : "h-11 rounded-sm",
        )}
      >
        <div
          className={cn(
            "flex items-center justify-center text-muted-foreground",
            size === "hero" ? "w-14" : "w-10",
          )}
        >
          {loading ? (
            <Loader2 className={cn("animate-spin", size === "hero" ? "h-5 w-5" : "h-4 w-4")} />
          ) : (
            <Search className={cn(size === "hero" ? "h-5 w-5" : "h-4 w-4")} />
          )}
        </div>
        <Input
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => value.trim().length >= 3 && setOpen(true)}
          placeholder={placeholder}
          className={cn(
            "flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0",
            size === "hero" ? "text-lg placeholder:text-lg" : "text-sm",
          )}
          maxLength={200}
          spellCheck={false}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={submitting || !value.trim()}
          className={cn(
            "flex items-center gap-2 bg-accent px-5 font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-40",
            size === "hero" ? "text-base" : "text-sm",
          )}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Working</span>
            </>
          ) : (
            <>
              <span>Analyze</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      {open && suggestions.length > 0 && (
        <div className="absolute inset-x-0 top-[calc(100%+8px)] z-40 overflow-hidden rounded-sm border border-border bg-popover shadow-lg animate-fade-in">
          <ul role="listbox">
            {suggestions.map((s, i) => (
              <li key={s.place_id}>
                <button
                  type="button"
                  onMouseEnter={() => setHighlighted(i)}
                  onClick={() => submitAddress(s.display_name)}
                  className={cn(
                    "flex w-full items-start gap-3 px-4 py-3 text-left text-sm",
                    i === highlighted ? "bg-muted" : "hover:bg-muted/60",
                  )}
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="line-clamp-2">{s.display_name}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-border bg-muted/40 px-4 py-2 text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>↑↓ navigate · enter select · esc dismiss</span>
          </div>
        </div>
      )}
    </div>
  );
}
