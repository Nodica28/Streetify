import { describe, it, expect } from "vitest";
import type { Amenity, CategoryKey } from "@/lib/types";
import {
  walkingScore,
  drivingScore,
  urbanLabel,
  amenityDensityPerKm2,
  categoryCounts,
  haversineMeters,
  URBAN_THRESHOLD,
  SUBURBAN_THRESHOLD,
} from "@/lib/scoring";

const make = (category: CategoryKey, distance_m: number, i = 0): Amenity => ({
  name: `${category}-${i}`,
  lat: 0,
  lng: 0,
  category,
  distance_m,
});

describe("walkingScore", () => {
  it("returns 0 with no amenities", () => {
    expect(walkingScore([])).toBe(0);
  });

  it("returns 0 when all amenities are outside the walking radius", () => {
    const amenities = [make("groceries", 2000), make("food", 1500)];
    expect(walkingScore(amenities)).toBe(0);
  });

  it("applies distance decay: closer amenities count more", () => {
    const close = [make("food", 100), make("food", 100)];
    const far = [make("food", 900), make("food", 900)];
    expect(walkingScore(close)).toBeGreaterThan(walkingScore(far));
  });

  it("rewards category diversity", () => {
    const diverse: Amenity[] = [
      make("groceries", 300),
      make("food", 300),
      make("school", 300),
      make("park", 300),
      make("health", 300),
    ];
    const monoculture: Amenity[] = Array.from({ length: 5 }, (_, i) => make("food", 300, i));
    expect(walkingScore(diverse)).toBeGreaterThan(walkingScore(monoculture));
  });

  it("caps at 100 even for a dense urban block", () => {
    const dense: Amenity[] = [];
    for (const cat of ["groceries", "food", "school", "park", "health", "transit", "shop", "fun"] as CategoryKey[]) {
      for (let i = 0; i < 30; i++) dense.push(make(cat, 200, i));
    }
    expect(walkingScore(dense)).toBe(100);
  });

  it("is bounded 0..100", () => {
    const cases: Amenity[][] = [
      [],
      [make("food", 100)],
      Array.from({ length: 100 }, (_, i) => make("food", 400, i)),
    ];
    for (const c of cases) {
      const s = walkingScore(c);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(100);
    }
  });
});

describe("drivingScore", () => {
  it("counts amenities in the wider 5km radius", () => {
    const amenitiesFarButDriveable: Amenity[] = Array.from({ length: 20 }, (_, i) =>
      make("shop", 3000, i),
    );
    expect(drivingScore(amenitiesFarButDriveable)).toBeGreaterThan(0);
    expect(walkingScore(amenitiesFarButDriveable)).toBe(0);
  });

  it("returns 0 when everything is beyond drive radius", () => {
    expect(drivingScore([make("food", 10_000)])).toBe(0);
  });

  it("is bounded 0..100", () => {
    const dense = Array.from({ length: 500 }, (_, i) => make("food", 2000, i));
    const s = drivingScore(dense);
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(100);
  });
});

describe("urbanLabel", () => {
  it("returns rural for empty or very sparse areas", () => {
    expect(urbanLabel([])).toBe("rural");
    expect(urbanLabel([make("food", 500)])).toBe("rural");
  });

  it("returns suburban at threshold boundary", () => {
    const amenities = Array.from({ length: SUBURBAN_THRESHOLD }, (_, i) => make("food", 500, i));
    expect(urbanLabel(amenities)).toBe("suburban");
  });

  it("returns urban at high density", () => {
    const amenities = Array.from({ length: URBAN_THRESHOLD }, (_, i) => make("food", 500, i));
    expect(urbanLabel(amenities)).toBe("urban");
  });

  it("ignores amenities outside walking radius when labelling", () => {
    const amenities = Array.from({ length: URBAN_THRESHOLD }, (_, i) => make("food", 3000, i));
    expect(urbanLabel(amenities)).toBe("rural");
  });
});

describe("amenityDensityPerKm2", () => {
  it("is 0 for no amenities", () => {
    expect(amenityDensityPerKm2([])).toBe(0);
  });

  it("scales with count", () => {
    const few = Array.from({ length: 5 }, (_, i) => make("food", 500, i));
    const many = Array.from({ length: 50 }, (_, i) => make("food", 500, i));
    expect(amenityDensityPerKm2(many)).toBeGreaterThan(amenityDensityPerKm2(few));
  });
});

describe("categoryCounts", () => {
  it("returns zero for all categories with empty input", () => {
    const counts = categoryCounts([]);
    expect(Object.values(counts).every((v) => v === 0)).toBe(true);
  });

  it("counts only amenities within walk radius", () => {
    const amenities = [make("food", 200), make("food", 1500), make("park", 400)];
    const counts = categoryCounts(amenities);
    expect(counts.food).toBe(1);
    expect(counts.park).toBe(1);
  });
});

describe("haversineMeters", () => {
  it("returns 0 for the same point", () => {
    expect(haversineMeters({ lat: 40.7128, lng: -74.006 }, { lat: 40.7128, lng: -74.006 })).toBe(0);
  });

  it("is roughly correct for a known distance (NYC → LA ~3944km)", () => {
    const nyc = { lat: 40.7128, lng: -74.006 };
    const la = { lat: 34.0522, lng: -118.2437 };
    const d = haversineMeters(nyc, la);
    expect(d).toBeGreaterThan(3_900_000);
    expect(d).toBeLessThan(4_000_000);
  });
});
