import type {
  EngravingStyle,
  ProductAvailability,
  ProductCondition,
  ProductOccasion,
  RingStyle,
  ShopBudgetBand,
  ShopCollectionFilter,
  ShopCollectionId,
  ShopFilters,
  ShopMetalStamp,
  ShopWeightBand,
  StoneType,
} from "@/lib/types";
import { createDefaultShopFilters } from "@/lib/shop-filter-utils";

const STONE_VALUES: StoneType[] = [
  "diamond",
  "emerald",
  "sapphire",
  "ruby",
  "turquoise",
  "onyx",
  "zabarjad",
  "yemen-aqeeq",
  "durr-najaf",
  "moral",
];

const STYLE_VALUES: RingStyle[] = [
  "solitaire",
  "halo",
  "vintage",
  "signet",
  "eternity",
  "stackable",
];

const ENGRAVING_VALUES: (EngravingStyle | "none")[] = [
  "none",
  "nastaliq",
  "naskh",
  "thuluth",
  "kufic",
  "modern",
];
const WEIGHT_VALUES: ShopWeightBand[] = ["light", "medium", "heavy"];
const METAL_STAMP_VALUES: ShopMetalStamp[] = ["0.925", "0.750", "0.585"];
const BUDGET_VALUES: ShopBudgetBand[] = ["entry", "mid", "premium", "luxury"];
const OCCASION_VALUES: ProductOccasion[] = [
  "engagement",
  "wedding",
  "anniversary",
  "birthday",
  "gift",
  "eid",
  "religious",
  "graduation",
  "everyday",
];

const AVAILABILITY_VALUES: ProductAvailability[] = [
  "ready",
  "preorder",
  "sold",
  "luxury",
  "made-to-order",
];

const COLLECTION_VALUES: Exclude<ShopCollectionFilter, "all">[] = [
  "bestseller",
  "featured",
];
const COLLECTION_ID_VALUES: ShopCollectionId[] = [
  "royal-heritage",
  "ancient-dynasty",
  "modern-nobility",
];

const CONDITION_VALUES: ProductCondition[] = ["new", "pre-owned"];

function parseCsv<T extends string>(raw: string | null, allowed: readonly T[]): T[] {
  if (!raw?.trim()) return [];
  const set = new Set(allowed);
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is T => set.has(s as T));
}

function serializeCsv(values: readonly string[]): string | null {
  if (values.length === 0) return null;
  return values.join(",");
}

export function parseShopFiltersFromParams(
  params: URLSearchParams,
  maxPrice: number
): ShopFilters {
  const defaults = createDefaultShopFilters(maxPrice);
  const priceMin = params.get("priceMin");
  const priceMax = params.get("priceMax");

  let min = defaults.priceRange[0];
  let max = defaults.priceRange[1];
  if (priceMin != null && priceMin !== "") {
    const n = Number(priceMin);
    if (!Number.isNaN(n)) min = Math.max(0, Math.min(n, maxPrice));
  }
  if (priceMax != null && priceMax !== "") {
    const n = Number(priceMax);
    if (!Number.isNaN(n)) max = Math.max(min, Math.min(n, maxPrice));
  }

  return {
    stones: parseCsv(params.get("stones"), STONE_VALUES),
    styles: parseCsv(params.get("styles"), STYLE_VALUES),
    engravingTypes: parseCsv(params.get("engraving"), ENGRAVING_VALUES),
    weightBands: parseCsv(params.get("weight"), WEIGHT_VALUES),
    metalStamps: parseCsv(params.get("stamp"), METAL_STAMP_VALUES),
    budgetBands: parseCsv(params.get("budget"), BUDGET_VALUES),
    occasions: parseCsv(params.get("occasion"), OCCASION_VALUES),
    availabilities: parseCsv(params.get("availability"), AVAILABILITY_VALUES),
    collections: parseCsv(params.get("collection"), COLLECTION_VALUES),
    collectionIds: parseCsv(params.get("collectionId"), COLLECTION_ID_VALUES),
    conditions: parseCsv(params.get("condition"), CONDITION_VALUES),
    priceRange: [min, max],
    query: params.get("q")?.trim() ?? "",
  };
}

export function parseShopPageFromParams(params: URLSearchParams): number {
  const raw = params.get("page");
  if (!raw) return 1;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export function buildShopSearchParams(
  filters: ShopFilters,
  maxPrice: number,
  page: number,
  current?: URLSearchParams
): URLSearchParams {
  const params = new URLSearchParams(current?.toString() ?? "");

  const setOrDelete = (key: string, value: string | null) => {
    if (value == null || value === "") params.delete(key);
    else params.set(key, value);
  };

  setOrDelete("stones", serializeCsv(filters.stones));
  setOrDelete("styles", serializeCsv(filters.styles));
  setOrDelete("engraving", serializeCsv(filters.engravingTypes));
  setOrDelete("weight", serializeCsv(filters.weightBands));
  setOrDelete("stamp", serializeCsv(filters.metalStamps));
  setOrDelete("budget", serializeCsv(filters.budgetBands));
  setOrDelete("occasion", serializeCsv(filters.occasions));
  setOrDelete("availability", serializeCsv(filters.availabilities));
  setOrDelete("collection", serializeCsv(filters.collections));
  setOrDelete("collectionId", serializeCsv(filters.collectionIds));
  setOrDelete("condition", serializeCsv(filters.conditions));
  setOrDelete("q", filters.query.trim() || null);

  const defaults = createDefaultShopFilters(maxPrice);
  if (filters.priceRange[0] > defaults.priceRange[0]) {
    setOrDelete("priceMin", String(filters.priceRange[0]));
  } else {
    params.delete("priceMin");
  }
  if (filters.priceRange[1] < defaults.priceRange[1]) {
    setOrDelete("priceMax", String(filters.priceRange[1]));
  } else {
    params.delete("priceMax");
  }

  if (page > 1) setOrDelete("page", String(page));
  else params.delete("page");

  return params;
}
