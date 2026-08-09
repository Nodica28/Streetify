import { NextResponse } from "next/server";
import { suggest } from "@/lib/geocode";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ip = clientIp(req);
  const rl = rateLimit({ bucket: "suggest", key: ip, max: 30, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, 120);
  if (q.length < 3) return NextResponse.json({ results: [] });

  try {
    const results = await suggest(q, 5);
    return NextResponse.json({ results });
  } catch (err) {
    console.error("suggest failed", err);
    return NextResponse.json({ results: [] });
  }
}
