export type CategoryKey =
  | "groceries"
  | "food"
  | "school"
  | "park"
  | "health"
  | "transit"
  | "shop"
  | "fun";

export const CATEGORY_META: Record<
  CategoryKey,
  { label: string; weight: number; colorVar: string }
> = {
  groceries: { label: "Groceries", weight: 3.0, colorVar: "--cat-groceries" },
  food: { label: "Food & Drink", weight: 1.5, colorVar: "--cat-food" },
  school: { label: "Schools", weight: 2.0, colorVar: "--cat-school" },
  park: { label: "Parks", weight: 2.5, colorVar: "--cat-park" },
  health: { label: "Healthcare", weight: 2.0, colorVar: "--cat-health" },
  transit: { label: "Transit", weight: 3.0, colorVar: "--cat-transit" },
  shop: { label: "Shopping", weight: 1.5, colorVar: "--cat-shop" },
  fun: { label: "Entertainment", weight: 1.0, colorVar: "--cat-fun" },
};

export const CATEGORY_KEYS: CategoryKey[] = Object.keys(CATEGORY_META) as CategoryKey[];

export interface Amenity {
  name: string;
  lat: number;
  lng: number;
  category: CategoryKey;
  distance_m: number;
}

export type UrbanLabel = "urban" | "suburban" | "rural";

export interface Insights {
  slug: string;
  address: string;
  lat: number;
  lng: number;
  walk_score: number;
  drive_score: number;
  urban_label: UrbanLabel;
  density: number;
  categories: Record<CategoryKey, number>;
  amenities: Amenity[];
  refreshed_at: string;
}
