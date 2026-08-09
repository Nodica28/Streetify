import "server-only";
import { supabaseAdmin } from "./supabase/server";
import { geocode } from "./geocode";
import { fetchAmenities } from "./overpass";
import { slugFromCoords, roundCoord } from "./slug";
import {
  walkingScore,
  drivingScore,
  urbanLabel,
  amenityDensityPerKm2,
  categoryCounts,
} from "./scoring";
import type { Insights } from "./types";

const CACHE_TTL_DAYS = 30;

export interface LookupOutcome {
  slug: string;
  cached: boolean;
}

export async function lookupAddress(rawAddress: string): Promise<LookupOutcome> {
  const address = rawAddress.trim().slice(0, 200);
  if (!address) throw new BadInput("Address is required");

  const geo = await geocode(address);
  if (!geo) throw new NotFound("Could not resolve that address");

  const lat = roundCoord(geo.lat);
  const lng = roundCoord(geo.lng);
  const slug = slugFromCoords(lat, lng);

  const supa = supabaseAdmin();
  const cutoff = new Date(Date.now() - CACHE_TTL_DAYS * 86_400_000).toISOString();

  const { data: existing, error: fetchErr } = await supa
    .from("insights")
    .select("slug, refreshed_at")
    .eq("slug", slug)
    .maybeSingle();

  if (fetchErr) throw new Error(`Supabase read failed: ${fetchErr.message}`);

  if (existing && existing.refreshed_at > cutoff) {
    return { slug, cached: true };
  }

  const amenities = await fetchAmenities(geo.lat, geo.lng);
  const walk_score = walkingScore(amenities);
  const drive_score = drivingScore(amenities);
  const urban_label = urbanLabel(amenities);
  const density = amenityDensityPerKm2(amenities);
  const categories = categoryCounts(amenities);

  const row = {
    slug,
    address: geo.address,
    lat,
    lng,
    walk_score,
    drive_score,
    urban_label,
    density,
    categories,
    amenities,
    refreshed_at: new Date().toISOString(),
  };

  const { error: upsertErr } = await supa.from("insights").upsert(row, { onConflict: "slug" });
  if (upsertErr) throw new Error(`Supabase write failed: ${upsertErr.message}`);

  return { slug, cached: false };
}

export async function getInsightsBySlug(slug: string): Promise<Insights | null> {
  const supa = supabaseAdmin();
  const { data, error } = await supa
    .from("insights")
    .select(
      "slug, address, lat, lng, walk_score, drive_score, urban_label, density, categories, amenities, refreshed_at",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`Supabase read failed: ${error.message}`);
  return (data as Insights | null) ?? null;
}

export class BadInput extends Error {
  status = 400;
}
export class NotFound extends Error {
  status = 404;
}
