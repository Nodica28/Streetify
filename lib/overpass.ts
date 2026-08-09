import "server-only";
import { type Amenity, type CategoryKey } from "./types";
import { haversineMeters, DRIVE_RADIUS_M, WALK_RADIUS_M } from "./scoring";

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.osm.jp/api/interpreter",
];

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

// Rich query at walk radius + destination-class query at drive radius.
// Restaurants/cafes/small shops are omitted from the drive ring — in a dense city
// they can number in the tens of thousands and blow past Overpass's timeout without
// meaningfully changing the drive score (which caps at 100 anyway).
function buildQuery(lat: number, lng: number, driveRadius: number, walkRadius: number): string {
  const walk = `(around:${walkRadius},${lat},${lng})`;
  const drive = `(around:${driveRadius},${lat},${lng})`;
  return `
[out:json][timeout:25];
(
  node["shop"~"^(supermarket|convenience|grocery|greengrocer|butcher|bakery|mall|department_store|clothes|shoes|hardware)$"]${walk};
  node["amenity"~"^(restaurant|cafe|bar|fast_food|pub|food_court|school|kindergarten|university|college|library|pharmacy|clinic|hospital|doctors|dentist|cinema|theatre|nightclub|bank|atm|bus_station|post_office)$"]${walk};
  node["leisure"~"^(park|playground|sports_centre|fitness_centre|swimming_pool|garden)$"]${walk};
  node["highway"="bus_stop"]${walk};
  node["railway"~"^(station|subway_entrance|tram_stop)$"]${walk};
  way["shop"~"^(supermarket|mall|department_store)$"]${walk};
  way["leisure"~"^(park|playground|sports_centre)$"]${walk};
  way["amenity"~"^(school|university|hospital|college)$"]${walk};

  node["shop"~"^(supermarket|mall|department_store)$"]${drive};
  node["amenity"~"^(hospital|university|college|cinema|theatre|bus_station)$"]${drive};
  node["leisure"~"^(park|sports_centre|swimming_pool)$"]${drive};
  node["railway"~"^(station|subway_entrance|tram_stop)$"]${drive};
  way["shop"~"^(supermarket|mall|department_store)$"]${drive};
  way["leisure"~"^(park|sports_centre)$"]${drive};
  way["amenity"~"^(hospital|university|college)$"]${drive};
);
out center tags 1500;
`.trim();
}

export async function fetchAmenities(lat: number, lng: number): Promise<Amenity[]> {
  const body = new URLSearchParams({ data: buildQuery(lat, lng, DRIVE_RADIUS_M, WALK_RADIUS_M) });

  let lastError: Error | null = null;
  let json: OverpassResponse | null = null;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": process.env.NOMINATIM_USER_AGENT ?? "streetify/1.0",
        },
        body,
        next: { revalidate: 60 * 60 * 24 },
      });

      if (res.ok) {
        json = (await res.json()) as OverpassResponse;
        break;
      }
      lastError = new Error(`Overpass ${endpoint} → ${res.status}`);
    } catch (err) {
      lastError = err as Error;
    }
  }

  if (!json) throw lastError ?? new Error("All Overpass endpoints failed");
  const origin = { lat, lng };
  const out: Amenity[] = [];
  const seen = new Set<string>();

  for (const el of json.elements) {
    const pos = el.type === "node" ? { lat: el.lat, lng: el.lon } : el.center && { lat: el.center.lat, lng: el.center.lon };
    if (!pos || pos.lat == null || pos.lng == null) continue;

    const category = classify(el.tags ?? {});
    if (!category) continue;

    // Dedup — the same feature can appear twice when both walk and drive queries return it
    const key = `${el.type}:${el.id}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const name = el.tags?.name ?? el.tags?.brand ?? categoryFallbackName(category);
    const distance_m = Math.round(haversineMeters(origin, { lat: pos.lat, lng: pos.lng }));

    out.push({ name, lat: pos.lat, lng: pos.lng, category, distance_m });
  }

  return out;
}

function classify(tags: Record<string, string>): CategoryKey | null {
  const shop = tags.shop;
  if (shop) {
    if (["supermarket", "convenience", "grocery", "greengrocer", "butcher", "bakery"].includes(shop)) return "groceries";
    if (["mall", "department_store", "clothes", "shoes", "hardware"].includes(shop)) return "shop";
  }
  const amenity = tags.amenity;
  if (amenity) {
    if (["restaurant", "cafe", "bar", "fast_food", "pub", "food_court"].includes(amenity)) return "food";
    if (["school", "kindergarten", "university", "college", "library"].includes(amenity)) return "school";
    if (["pharmacy", "clinic", "hospital", "doctors", "dentist"].includes(amenity)) return "health";
    if (["cinema", "theatre", "nightclub"].includes(amenity)) return "fun";
    if (["bus_station", "post_office", "atm", "bank"].includes(amenity)) return amenity === "bus_station" ? "transit" : "shop";
  }
  if (tags.leisure) {
    if (["park", "playground", "garden"].includes(tags.leisure)) return "park";
    if (["sports_centre", "fitness_centre", "swimming_pool"].includes(tags.leisure)) return "fun";
  }
  if (tags.highway === "bus_stop") return "transit";
  if (tags.railway && ["station", "subway_entrance", "tram_stop"].includes(tags.railway)) return "transit";
  return null;
}

function categoryFallbackName(category: CategoryKey): string {
  const map: Record<CategoryKey, string> = {
    groceries: "Grocery store",
    food: "Restaurant",
    school: "School",
    park: "Park",
    health: "Healthcare",
    transit: "Transit stop",
    shop: "Shop",
    fun: "Entertainment",
  };
  return map[category];
}
