import { cn } from "@/lib/utils";

export function StreetifyMark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-baseline font-display font-semibold tracking-tight", className)}>
      <span>Street</span>
      <span className="text-accent">ify</span>
      <span aria-hidden className="ml-0.5 text-accent">.</span>
    </span>
  );
}
