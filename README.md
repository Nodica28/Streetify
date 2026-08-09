# Streetify

**Live app:** https://streetify.vercel.app

Type any street address and get a Walking Score, a Driving Score, an Urban/Suburban Index, and an interactive map of nearby amenities — with a URL you can share that renders identically for anyone who opens it.

---

## What I built vs. what AI generated

**Me (Justine):**
- **Pivoted the planning** — reshaped the initial scope into a focused product with three defensible heuristics, a share-by-URL model, and a real hosting path.
- **Chose the stack:** Next.js 15 (App Router) + TypeScript, TailwindCSS + shadcn-style components, Supabase (Postgres + RLS), Leaflet on OpenStreetMap.
- **Set up Supabase** — created the project, ran the schema migration in the dashboard, wired the environment for local and production.
- **Wrote the system requirements:** server-side-only external API calls, deterministic slugs for shareability, 30-day cache TTL, per-IP rate limiting, RLS-restricted tables, no service keys in the browser.
- **Enforced standards throughout** — caught and renamed a mis-prefixed public secret key before it shipped, required unit + Playwright verification, kept a conventional-commit git history, and made sure `.env` files never touched source control.
- **Verified end-to-end** in a real browser: home, autocomplete, insights page, map interactions, category filters, theme toggle, share flow, and DB persistence.
- **Deployed** to Vercel.

**AI (Claude Code):**
- Implemented the code against the requirements above — scoring functions, Overpass query, insights service, route handlers, React components, Leaflet map, dynamic OG image, and the Vitest + Playwright specs.
- Drafted the initial editorial design tokens and layouts, then iterated until they passed my review.
- Diagnosed and fixed the Overpass 504 on dense-city queries (split walk/drive queries, added three-endpoint failover).

---

## Approach

Build the minimum end-to-end path first, then extend. Foundations → scoring math (provable with unit tests) → external clients → API routes → UI. Every phase left the app runnable, so nothing was ever "half-finished." Real addresses across urban / suburban / rural were verified before calling it done.

Scoring math is a pure function, so it's the only thing I trust unit tests to prove correct. Everything else is exercised by a Playwright golden-path spec that runs the full flow: search → insights → copy the URL → open it in a fresh browser context → assert the same page renders.

---

## Design decisions & assumptions

- **OpenStreetMap over paid providers.** Nominatim (geocode) + Overpass (amenities) + OSM tiles. No keys, no billing. Trade-off: Nominatim requires a real `User-Agent` and caps at 1 req/s — the app respects both and adds sliding-window per-IP limits on top.
- **Deterministic slugs from coordinates** (rounded to ~11 m). Same address → same URL, so sharing is "just links" — no auth, no expiring tokens. Small trade-off: two neighboring addresses that round to the same coord share a page (acceptable for a neighborhood-level tool).
- **All external calls server-side.** Route handlers + server components. Keeps the Supabase secret key off the browser, gives one place to attach the `User-Agent`, and lets Next.js cache aggressively.
- **Simple, documented heuristics.** Walking Score = weighted amenity count within 1 km with distance decay and a category-diversity bonus. Driving Score = weighted count within 5 km. Urban Index = density label (urban / suburban / rural). Everything is in `lib/scoring.ts` and easy to tune.
- **Search history is per-device localStorage** (per the brief). Supabase only backs cross-device shareable pages.
- **Shared pages are public by design** — the UI notes this to viewers. No auth, no PII collected.

---

## Local dev

```
pnpm install
cp .env.local.example .env.local   # fill in Supabase URL + publishable key + secret key
node scripts/verify-supabase.mjs   # confirms the schema is in place
pnpm dev                            # http://localhost:3000
pnpm test                           # Vitest unit tests
pnpm test:e2e                       # Playwright golden path
```

Data © OpenStreetMap contributors.
