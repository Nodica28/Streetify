import "server-only";

// Simple sliding-window rate limiter kept in process memory.
// Good enough for a single Vercel instance / small traffic. For true
// distributed limits, back this with a Supabase table (schema already in place).

interface WindowState {
  windowStart: number;
  count: number;
}

const buckets = new Map<string, WindowState>();

export interface RateLimitOptions {
  bucket: string;
  key: string;
  max: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
}

export function rateLimit(opts: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const mapKey = `${opts.bucket}::${opts.key}`;
  const state = buckets.get(mapKey);

  if (!state || now - state.windowStart >= opts.windowMs) {
    buckets.set(mapKey, { windowStart: now, count: 1 });
    return { allowed: true, remaining: opts.max - 1, resetInMs: opts.windowMs };
  }

  if (state.count >= opts.max) {
    return {
      allowed: false,
      remaining: 0,
      resetInMs: opts.windowMs - (now - state.windowStart),
    };
  }

  state.count += 1;
  return {
    allowed: true,
    remaining: opts.max - state.count,
    resetInMs: opts.windowMs - (now - state.windowStart),
  };
}

export function clientIp(req: Request): string {
  const h = req.headers;
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return h.get("x-real-ip") ?? "0.0.0.0";
}
