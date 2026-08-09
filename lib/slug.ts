// Deterministic slug from coordinates. Same address → same slug → same shareable URL.
// We round to 4 decimal places (~11m at the equator) so tiny geocoding jitter still
// resolves to the same cached row.

const COORD_PRECISION = 4;

export function roundCoord(n: number): number {
  return Number(n.toFixed(COORD_PRECISION));
}

export function slugFromCoords(lat: number, lng: number): string {
  const key = `${roundCoord(lat).toFixed(COORD_PRECISION)}|${roundCoord(lng).toFixed(COORD_PRECISION)}`;
  return hash8(key);
}

// Small non-crypto hash → 8-char base36. Purely for URL slugs.
// (Not for security. Collisions are extremely unlikely at our scale.)
function hash8(input: string): string {
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const combined = (BigInt(h2 >>> 0) << 32n) | BigInt(h1 >>> 0);
  return combined.toString(36).padStart(8, "0").slice(-8);
}
