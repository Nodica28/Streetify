import { type Amenity, type CategoryKey, CATEGORY_KEYS, CATEGORY_META, type UrbanLabel } from "./types";

// Radii in meters
export const WALK_RADIUS_M = 1000;
export const DRIVE_RADIUS_M = 5000;

// Density thresholds — amenities within the walk radius
export const URBAN_THRESHOLD = 80;
export const SUBURBAN_THRESHOLD = 20;

const WALK_DIVERSITY_BONUS = 5;
const WALK_DIVERSITY_CAP = 25;
const DRIVE_DIVERSITY_BONUS = 4;
const DRIVE_DIVERSITY_CAP = 20;

const WALK_MULTIPLIER = 1.1;
const DRIVE_MULTIPLIER = 0.35;

export function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function withinRadius(amenities: Amenity[], radius: number): Amenity[] {
  return amenities.filter((a) => a.distance_m <= radius);
}

function decayForWalk(distance_m: number): number {
  if (distance_m <= 500) return 1;
  if (distance_m <= WALK_RADIUS_M) return 0.5;
  return 0;
}

export function walkingScore(amenities: Amenity[]): number {
  const inRange = withinRadius(amenities, WALK_RADIUS_M);
  if (inRange.length === 0) return 0;

  let raw = 0;
  const cats = new Set<CategoryKey>();
  for (const a of inRange) {
    raw += CATEGORY_META[a.category].weight * decayForWalk(a.distance_m);
    cats.add(a.category);
  }

  const diversity = Math.min(WALK_DIVERSITY_CAP, cats.size * WALK_DIVERSITY_BONUS);
  const score = Math.round(raw * WALK_MULTIPLIER + diversity);
  return clamp(score, 0, 100);
}

export function drivingScore(amenities: Amenity[]): number {
  const inRange = withinRadius(amenities, DRIVE_RADIUS_M);
  if (inRange.length === 0) return 0;

  let raw = 0;
  const cats = new Set<CategoryKey>();
  for (const a of inRange) {
    raw += CATEGORY_META[a.category].weight;
    cats.add(a.category);
  }

  const diversity = Math.min(DRIVE_DIVERSITY_CAP, cats.size * DRIVE_DIVERSITY_BONUS);
  const score = Math.round(raw * DRIVE_MULTIPLIER + diversity);
  return clamp(score, 0, 100);
}

export function urbanLabel(amenities: Amenity[]): UrbanLabel {
  const count = withinRadius(amenities, WALK_RADIUS_M).length;
  if (count >= URBAN_THRESHOLD) return "urban";
  if (count >= SUBURBAN_THRESHOLD) return "suburban";
  return "rural";
}

export function amenityDensityPerKm2(amenities: Amenity[]): number {
  const count = withinRadius(amenities, WALK_RADIUS_M).length;
  const areaKm2 = (Math.PI * (WALK_RADIUS_M / 1000) ** 2);
  return Number((count / areaKm2).toFixed(2));
}

export function categoryCounts(amenities: Amenity[]): Record<CategoryKey, number> {
  const result = Object.fromEntries(CATEGORY_KEYS.map((k) => [k, 0])) as Record<
    CategoryKey,
    number
  >;
  const inWalk = withinRadius(amenities, WALK_RADIUS_M);
  for (const a of inWalk) result[a.category]++;
  return result;
}

export function walkQualitativeLabel(score: number): string {
  if (score >= 90) return "Walker's Paradise";
  if (score >= 70) return "Very Walkable";
  if (score >= 50) return "Somewhat Walkable";
  if (score >= 25) return "Car-Dependent";
  return "Car-Only";
}

export function driveQualitativeLabel(score: number): string {
  if (score >= 85) return "Effortless Errands";
  if (score >= 65) return "Easy Driving";
  if (score >= 40) return "Modest Reach";
  return "Sparse Options";
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
