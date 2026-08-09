import { NextResponse } from "next/server";
import { lookupAddress, BadInput, NotFound } from "@/lib/insights-service";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = rateLimit({ bucket: "lookup", key: ip, max: 10, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: { address?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const address = typeof body.address === "string" ? body.address : "";
  if (!address.trim()) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 });
  }

  try {
    const outcome = await lookupAddress(address);
    return NextResponse.json(outcome);
  } catch (err) {
    if (err instanceof BadInput) return NextResponse.json({ error: err.message }, { status: 400 });
    if (err instanceof NotFound) return NextResponse.json({ error: err.message }, { status: 404 });
    console.error("lookup failed", err);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
