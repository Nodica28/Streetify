import "server-only";

const NOMINATIM = "https://nominatim.openstreetmap.org";

function userAgent(): string {
  return process.env.NOMINATIM_USER_AGENT ?? "streetify/1.0 (no-contact-set)";
}

export interface GeocodeResult {
  address: string;
  lat: number;
  lng: number;
}

export interface Suggestion {
  display_name: string;
  lat: number;
  lng: number;
  place_id: number;
}

export async function geocode(address: string): Promise<GeocodeResult | null> {
  const url = new URL(`${NOMINATIM}/search`);
  url.searchParams.set("q", address);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "0");

  const res = await fetch(url, {
    headers: {
      "User-Agent": userAgent(),
      "Accept-Language": "en",
    },
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!res.ok) throw new Error(`Nominatim search failed: ${res.status}`);
  const json = (await res.json()) as Array<{ display_name: string; lat: string; lon: string }>;
  if (!json.length) return null;
  const top = json[0];
  return {
    address: top.display_name,
    lat: parseFloat(top.lat),
    lng: parseFloat(top.lon),
  };
}

export async function suggest(query: string, limit = 5): Promise<Suggestion[]> {
  if (query.trim().length < 3) return [];
  const url = new URL(`${NOMINATIM}/search`);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", String(Math.min(limit, 10)));
  url.searchParams.set("addressdetails", "0");

  const res = await fetch(url, {
    headers: {
      "User-Agent": userAgent(),
      "Accept-Language": "en",
    },
    next: { revalidate: 60 * 10 },
  });

  if (!res.ok) throw new Error(`Nominatim suggest failed: ${res.status}`);
  const json = (await res.json()) as Array<{
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
  }>;
  return json.map((r) => ({
    place_id: r.place_id,
    display_name: r.display_name,
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
  }));
}
