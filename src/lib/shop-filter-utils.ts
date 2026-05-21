import { STONE_OPTIONS } from "@/lib/constants";
import { fa } from "@/lib/i18n/fa";
import { getProductStatusConfig, PRODUCT_AVAILABILITY_OPTIONS } from "@/lib/product-status";
import { isPreOwnedProduct } from "@/lib/pre-owned";
import type {
  EngravingStyle,
  Product,
  ProductAvailability,
  ProductCondition,
  RingStyle,
  ShopCollectionFilter,
  ShopCollectionId,
  ShopFilters,
  StoneType,
} from "@/lib/types";
import { formatPrice } from "@/lib/utils";

export function applyShopFilters(
  catalog: Product[],
  filters: ShopFilters,
  options?: { skipQuery?: boolean }
): Product[] {
  const q = options?.skipQuery ? "" : filters.query.trim().toLowerCase();
  return catalog.filter((p) => {
    if (q) {
      const haystack = [
        p.name,
        p.namePersian,
        p.collection ?? "",
        p.listing?.headline ?? "",
        ...(p.listing?.details ?? []),
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (filters.stones.length > 0 && !filters.stones.includes(p.stone)) return false;
    if (filters.styles.length > 0 && !filters.styles.includes(p.category)) return false;
    if (filters.engravingTypes.length > 0) {
      const matches = filters.engravingTypes.some((et) => {
        if (et === "none") return p.engravingType === "none";
        return p.engravingType === et;
      });
      if (!matches) return false;
    }
    if (filters.availabilities.length > 0 && !filters.availabilities.includes(p.availability)) {
      return false;
    }
    if (filters.collections.length > 0) {
      const matchesCollection = filters.collections.some((c) => {
        if (c === "bestseller") return Boolean(p.bestseller);
        if (c === "featured") return Boolean(p.featured);
        return false;
      });
      if (!matchesCollection) return false;
    }
    if (filters.collectionIds.length > 0) {
      const productCollectionId = (p.collectionId as ShopCollectionId | undefined) ?? null;
      if (!productCollectionId || !filters.collectionIds.includes(productCollectionId)) return false;
    }
    if (filters.conditions.length > 0) {
      const condition: ProductCondition = isPreOwnedProduct(p) ? "pre-owned" : "new";
      if (!filters.conditions.includes(condition)) return false;
    }
    if (p.price < filters.priceRange[0] || p.price > filters.priceRange[1]) return false;
    return true;
  });
}

const styleLabels: Record<RingStyle, string> = {
  solitaire: fa.shop.styles.solitaire,
  halo: fa.shop.styles.halo,
  vintage: fa.shop.styles.vintage,
  signet: fa.shop.styles.signet,
  eternity: fa.shop.styles.eternity,
  stackable: fa.shop.styles.stackable,
};

const engravingLabels: Record<EngravingStyle | "none", string> = {
  none: fa.shop.engravingOptions.none,
  nastaliq: fa.engravings.nastaliq,
  naskh: fa.engravings.naskh,
  thuluth: fa.engravings.thuluth,
  kufic: fa.engravings.kufic,
  modern: fa.engravings.modern,
};

export function createDefaultShopFilters(maxPrice: number): ShopFilters {
  return {
    stones: [],
    priceRange: [0, maxPrice],
    styles: [],
    engravingTypes: [],
    availabilities: [],
    collections: [],
    collectionIds: [],
    conditions: [],
    query: "",
  };
}

const collectionLabels: Record<Exclude<ShopCollectionFilter, "all">, string> = {
  bestseller: fa.shop.collectionOptions.bestseller,
  featured: fa.shop.collectionOptions.featured,
};

const collectionIdLabels: Record<ShopCollectionId, string> = {
  "royal-heritage": fa.collections["royal-heritage"].name,
  "ancient-dynasty": fa.collections["ancient-dynasty"].name,
  "modern-nobility": fa.collections["modern-nobility"].name,
};

const conditionLabels: Record<ProductCondition, string> = {
  new: fa.shop.conditionOptions.new,
  "pre-owned": fa.shop.conditionOptions.preOwned,
};

export function countActiveFilters(filters: ShopFilters, maxPrice: number): number {
  let n = 0;
  n += filters.stones.length;
  n += filters.styles.length;
  n += filters.engravingTypes.length;
  n += filters.availabilities.length;
  n += filters.collections.length;
  n += filters.collectionIds.length;
  n += filters.conditions.length;
  if (filters.query.trim()) n += 1;
  if (filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice) n += 1;
  return n;
}

export function hasActiveFilters(filters: ShopFilters, maxPrice: number): boolean {
  return countActiveFilters(filters, maxPrice) > 0;
}

export type FilterChip = {
  id: string;
  label: string;
  onRemove: () => void;
};

function removeFromArray<T>(arr: T[], item: T): T[] {
  return arr.filter((x) => x !== item);
}

export function buildFilterChips(
  filters: ShopFilters,
  maxPrice: number,
  onChange: (next: ShopFilters) => void
): FilterChip[] {
  const chips: FilterChip[] = [];

  for (const stone of filters.stones) {
    const label = STONE_OPTIONS.find((s) => s.value === stone)?.label ?? stone;
    chips.push({
      id: `stone-${stone}`,
      label: `${fa.shop.stone}: ${label}`,
      onRemove: () => onChange({ ...filters, stones: removeFromArray(filters.stones, stone) }),
    });
  }

  for (const style of filters.styles) {
    chips.push({
      id: `style-${style}`,
      label: `${fa.shop.style}: ${styleLabels[style]}`,
      onRemove: () => onChange({ ...filters, styles: removeFromArray(filters.styles, style) }),
    });
  }

  for (const engraving of filters.engravingTypes) {
    chips.push({
      id: `engraving-${engraving}`,
      label: `${fa.shop.engraving}: ${engravingLabels[engraving]}`,
      onRemove: () =>
        onChange({
          ...filters,
          engravingTypes: removeFromArray(filters.engravingTypes, engraving),
        }),
    });
  }

  for (const availability of filters.availabilities) {
    const config = getProductStatusConfig(availability);
    chips.push({
      id: `availability-${availability}`,
      label: `${fa.shop.availability}: ${config.label}`,
      onRemove: () =>
        onChange({
          ...filters,
          availabilities: removeFromArray(filters.availabilities, availability),
        }),
    });
  }

  for (const collection of filters.collections) {
    chips.push({
      id: `collection-${collection}`,
      label: `${fa.shop.collection}: ${collectionLabels[collection]}`,
      onRemove: () =>
        onChange({
          ...filters,
          collections: removeFromArray(filters.collections, collection),
        }),
    });
  }

  for (const collectionId of filters.collectionIds) {
    chips.push({
      id: `collectionId-${collectionId}`,
      label: `${fa.shop.collection}: ${collectionIdLabels[collectionId]}`,
      onRemove: () =>
        onChange({
          ...filters,
          collectionIds: removeFromArray(filters.collectionIds, collectionId),
        }),
    });
  }

  if (filters.query.trim()) {
    chips.push({
      id: "query",
      label: `${fa.nav.search}: ${filters.query}`,
      onRemove: () => onChange({ ...filters, query: "" }),
    });
  }

  for (const condition of filters.conditions) {
    chips.push({
      id: `condition-${condition}`,
      label: `${fa.shop.condition}: ${conditionLabels[condition]}`,
      onRemove: () =>
        onChange({
          ...filters,
          conditions: removeFromArray(filters.conditions, condition),
        }),
    });
  }

  if (filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice) {
    chips.push({
      id: "price",
      label: `${fa.shop.priceRange}: ${formatPrice(filters.priceRange[0])} – ${formatPrice(filters.priceRange[1])}`,
      onRemove: () => onChange({ ...filters, priceRange: [0, maxPrice] }),
    });
  }

  return chips;
}

export const collectionFilterOptions: {
  value: Exclude<ShopCollectionFilter, "all">;
  label: string;
}[] = [
  { value: "bestseller", label: fa.shop.collectionOptions.bestseller },
  { value: "featured", label: fa.shop.collectionOptions.featured },
];

export const collectionIdFilterOptions: { value: ShopCollectionId; label: string }[] = [
  { value: "royal-heritage", label: collectionIdLabels["royal-heritage"] },
  { value: "ancient-dynasty", label: collectionIdLabels["ancient-dynasty"] },
  { value: "modern-nobility", label: collectionIdLabels["modern-nobility"] },
];

export const availabilityFilterOptions: { value: ProductAvailability; label: string }[] =
  PRODUCT_AVAILABILITY_OPTIONS.map((value) => ({
    value,
    label: getProductStatusConfig(value).shortLabel,
  }));

export const styleFilterOptions: { value: RingStyle; label: string }[] = [
  { value: "solitaire", label: fa.shop.styles.solitaire },
  { value: "halo", label: fa.shop.styles.halo },
  { value: "vintage", label: fa.shop.styles.vintage },
  { value: "signet", label: fa.shop.styles.signet },
  { value: "eternity", label: fa.shop.styles.eternity },
  { value: "stackable", label: fa.shop.styles.stackable },
];

export const engravingFilterOptions: { value: EngravingStyle | "none"; label: string }[] = [
  { value: "none", label: fa.shop.engravingOptions.none },
  { value: "nastaliq", label: fa.engravings.nastaliq },
  { value: "naskh", label: fa.engravings.naskh },
  { value: "thuluth", label: fa.engravings.thuluth },
  { value: "kufic", label: fa.engravings.kufic },
  { value: "modern", label: fa.engravings.modern },
];

export const stoneFilterOptions = STONE_OPTIONS.map((s) => ({
  value: s.value as StoneType,
  label: s.label,
  swatch: s.color,
}));

export const conditionFilterOptions: { value: ProductCondition; label: string }[] = [
  { value: "new", label: fa.shop.conditionOptions.new },
  { value: "pre-owned", label: fa.shop.conditionOptions.preOwned },
];
