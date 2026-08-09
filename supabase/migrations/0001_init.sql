-- Streetify — initial schema
-- Single table caches insights per rounded coordinate. Public read; writes only from server.

create extension if not exists "pgcrypto";

create table if not exists public.insights (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  address       text not null,
  lat           double precision not null,
  lng           double precision not null,
  walk_score    integer not null,
  drive_score   integer not null,
  urban_label   text not null check (urban_label in ('urban','suburban','rural')),
  density       numeric not null,
  categories    jsonb not null,
  amenities     jsonb not null,
  created_at    timestamptz not null default now(),
  refreshed_at  timestamptz not null default now()
);

create index if not exists insights_slug_idx on public.insights (slug);
create index if not exists insights_coord_idx on public.insights (lat, lng);

alter table public.insights enable row level security;

drop policy if exists "insights_read_all" on public.insights;
create policy "insights_read_all" on public.insights
  for select using (true);

-- Simple per-IP rate limit table (server-authoritative)
create table if not exists public.rate_limits (
  ip           text not null,
  bucket       text not null,
  window_start timestamptz not null,
  count        integer not null default 0,
  primary key (ip, bucket, window_start)
);

create index if not exists rate_limits_ip_bucket_idx on public.rate_limits (ip, bucket, window_start desc);

alter table public.rate_limits enable row level security;
-- No anon policies: only service role can touch this table.
