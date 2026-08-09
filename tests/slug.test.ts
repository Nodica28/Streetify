import { describe, it, expect } from "vitest";
import { slugFromCoords, roundCoord } from "@/lib/slug";

describe("slugFromCoords", () => {
  it("is deterministic for the same coords", () => {
    expect(slugFromCoords(40.7128, -74.006)).toBe(slugFromCoords(40.7128, -74.006));
  });

  it("returns the same slug for coords within ~11m rounding tolerance", () => {
    const a = slugFromCoords(40.71284, -74.00601);
    const b = slugFromCoords(40.71283, -74.006014);
    expect(a).toBe(b);
  });

  it("returns different slugs for meaningfully different coords", () => {
    expect(slugFromCoords(40.7128, -74.006)).not.toBe(slugFromCoords(34.0522, -118.2437));
  });

  it("produces an 8-char base36 string", () => {
    const s = slugFromCoords(48.8566, 2.3522);
    expect(s).toMatch(/^[0-9a-z]{8}$/);
  });
});

describe("roundCoord", () => {
  it("rounds to 4 decimal places", () => {
    expect(roundCoord(40.712834)).toBe(40.7128);
    expect(roundCoord(-74.006012)).toBe(-74.006);
  });
});
