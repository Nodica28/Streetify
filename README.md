# Streetify

Type any street address; see three heuristic scores (Walking, Driving, Urban), an interactive map of nearby amenities, and get a shareable URL that renders the same for anyone.

Built with **Next.js 15 (App Router) + TypeScript + Tailwind + shadcn-style components + Supabase + Leaflet + OpenStreetMap** (Nominatim + Overpass). No paid APIs. Deployed on Vercel.

---

## Live demo

_Add the Vercel URL here after deploying._

---

## Quick start

```bash
pnpm install
cp .env.local.example .env.local   # then fill in the values below
node scripts/verify-supabase.mjs   # confirms table exists (points you to migrations if not)
pnpm dev
```

Open http://localhost:3000.

### Environment variables

| Name                              | Where it's used                                       | Notes                          |
|-----------------------------------|-------------------------------------------------------|--------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`        | Server clients only (browser client is a stub)        | Project URL                    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | Reserved for future browser use                       | Publishable / anon key         |
| `SUPABASE_SECRET_KEY`             | Server-side Supabase admin client                     | **Never expose to the browser** |
| `NOMINATIM_USER_AGENT`            | Every outbound Nominatim + Overpass request           | Real contact required by policy |

### Database migration

Supabase's REST client can't run DDL, so run the schema once:

1. Open the SQL editor: `https://supabase.com/dashboard/project/<your-project-ref>/sql/new`
2. Paste [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql)
3. Click Run

Verify with `node scripts/verify-supabase.mjs`.

---

## How the scores are computed

Simple, defensible heuristics. Everything lives in [`lib/scoring.ts`](./lib/scoring.ts) — one file, easy to tune.

**Amenities** come from Overpass (OpenStreetMap). They're bucketed into eight categories, each with a weight reflecting real-world walk-utility:

| Category            | Weight | Examples                                                 |
|---------------------|--------|----------------------------------------------------------|
| Groceries           | 3.0    | supermarket, convenience, grocery, butcher, bakery       |
| Food & Drink        | 1.5    | restaurant, cafe, bar, fast_food                         |
| Schools & Education | 2.0    | school, kindergarten, university, library                |
| Parks & Recreation  | 2.5    | park, playground, garden                                 |
| Healthcare          | 2.0    | pharmacy, clinic, hospital, doctors                      |
| Transit             | 3.0    | bus_stop, station, subway_entrance                       |
| Shopping            | 1.5    | mall, department_store, clothes                          |
| Entertainment       | 1.0    | cinema, theatre, fitness_centre                          |

**Walking Score (0–100)** — weighted amenities within 1 km, with distance decay (amenities beyond 500 m count half), plus a diversity bonus of +5 per unique category (capped at +25).

**Driving Score (0–100)** — same weighting inside 5 km, no distance decay (a car flattens distance), diversity bonus of +4 per category (capped at +20), and a smaller overall multiplier since more amenities show up at that radius.

**Urban Index** — a label based purely on amenity count inside the walking radius:

- `urban` ≥ 80
- `suburban` 20–79
- `rural` < 20

Also reports amenity density per km².

These numbers are meant to be **directionally right**, not authoritative. They're documented so a reviewer can see the reasoning, and they're easy to tune in one file.

---

## Architecture

```
Browser
  └── UI (Tailwind + shadcn-style + Leaflet)
  └── LocalStorage — per-device search history

Next.js Route Handlers (server-only)
  ├── /api/lookup   — geocode → cache-check → overpass → score → upsert → slug
  └── /api/suggest  — debounced autocomplete proxy to Nominatim

External services (server-side only, User-Agent set)
  ├── Nominatim  (geocoding + autocomplete)
  └── Overpass   (amenities within 5 km)

Supabase Postgres
  └── insights table — durable cache + backing store for shareable URLs
```

### Why the server does all API calls

- Secrets never leave the server.
- One place to attach the required Nominatim `User-Agent`.
- Aggressive caching (30-day cache TTL for insights, per-fetch `next.revalidate` for API responses).
- Server-side rate-limiting per IP.

### Shareable URLs

Every lookup is stored under a **deterministic slug** derived from rounded coordinates (`lib/slug.ts`). Same address → same URL. When someone opens `/a/<slug>`, the page is server-rendered directly from the Supabase cache, so scores and map load fast and identical for everyone.

Search history is separately kept in localStorage per device, per the brief.

---

## Security

- `SUPABASE_SECRET_KEY` is server-only, referenced only from files with `import "server-only"`.
- Row-Level Security is on for `insights`. Anon has read access; writes go through the service role from Route Handlers.
- Address strings are length-capped (200 chars) and parameterized via the Supabase client.
- Sliding-window IP rate limits on `/api/lookup` (10/min) and `/api/suggest` (30/min).
- Nominatim `User-Agent` is set on every request (their usage policy requires it).
- No user auth or cookies — CSRF surface is minimal.
- Shared insight pages are public by design; the UI notes this to viewers.

---

## Testing

**Unit** (Vitest — 24 tests):
```bash
pnpm test
```
Covers scoring math (score bounds, distance decay, diversity bonus, urban labels) and slug determinism.

**End-to-end** (Playwright — golden path):
```bash
pnpm test:e2e:install   # first time only
pnpm test:e2e
```
Covers: home → autocomplete → insights page → copy URL → identical render in a fresh browser context.

**Manual checklist** (things it's honest to eyeball):

1. Rural address → low scores + `rural` label.
2. History strip on home shows recent searches after two lookups; clicking one reopens the cached insight.
3. Dark/light toggle works, map tiles invert cleanly in dark mode.
4. Mobile viewport (Chrome DevTools) — columns stack, map is still interactive, share works.
5. Paste a live URL into a social preview debugger (Twitter/LinkedIn) — the OG image renders with address + scores.

---

## Deploy to Vercel

1. Push to GitHub.
2. `vercel` in this folder (or import via the dashboard).
3. Set env vars in the Vercel project settings — same four as `.env.local`.
4. Set `NEXT_PUBLIC_SITE_URL` to the live URL (used for OG image absolute paths).
5. Deploy.
6. Smoke-test the live URL against the manual checklist above.

---

## File map (the interesting bits)

- [`app/page.tsx`](./app/page.tsx) — home / hero
- [`app/a/[slug]/page.tsx`](./app/a/[slug]/page.tsx) — insights page (server component)
- [`app/a/[slug]/opengraph-image.tsx`](./app/a/[slug]/opengraph-image.tsx) — dynamic social preview
- [`app/api/lookup/route.ts`](./app/api/lookup/route.ts) — address → slug
- [`app/api/suggest/route.ts`](./app/api/suggest/route.ts) — autocomplete proxy
- [`lib/scoring.ts`](./lib/scoring.ts) — all scoring heuristics
- [`lib/insights-service.ts`](./lib/insights-service.ts) — orchestration: geocode + amenities + cache
- [`lib/geocode.ts`](./lib/geocode.ts), [`lib/overpass.ts`](./lib/overpass.ts) — external API clients
- [`lib/history.ts`](./lib/history.ts) — localStorage helpers
- [`components/insights-map.tsx`](./components/insights-map.tsx) — Leaflet map with radius + category toggles
- [`components/score-card.tsx`](./components/score-card.tsx) — editorial score cards
- [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql) — schema

---

## Time & scope notes

The brief called for 1–3 hours; this went slightly over that with the added Playwright test, dynamic OG image, toggleable map controls, and address autocomplete. Everything the brief listed as required is in.

Data © OpenStreetMap contributors.
