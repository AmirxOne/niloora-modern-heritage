import { STONE_OPTIONS } from "@/lib/constants";
import { matchesProductSearchQuery } from "@/lib/catalog/product-catalog";
import { fa } from "@/lib/i18n/fa";
import { getProductStatusConfig, PRODUCT_AVAILABILITY_OPTIONS } from "@/lib/product-status";
import { isPreOwnedProduct } from "@/lib/pre-owned";
import { getProductArtisanLinks } from "@/lib/artisans";
import { getStoneGuideForProduct } from "@/lib/stones";
import type {
  EngravingStyle,
  Product,
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
} from "@/lib/types";
import { formatPrice } from "@/lib/utils";

type CatalogFilterOption = {
  value: string;
  label: string;
  swatch?: string;
  image?: string;
};

function fallbackStoneLabel(stone: Product["stone"]): string {
  return STONE_OPTIONS.find((s) => s.value === stone)?.label ?? stone;
}

function fallbackStoneSwatch(stone: Product["stone"]): string | undefined {
  return STONE_OPTIONS.find((s) => s.value === stone)?.color;
}

function productStoneFilterKeys(product: Product): string[] {
  const guide = getStoneGuideForProduct(product);
  const keys = new Set<string>([product.stone]);
  if (guide) {
    keys.add(guide.id);
    keys.add(guide.slug);
    if (guide.coreStone) keys.add(guide.coreStone);
  }
  return Array.from(keys);
}

function primaryProductStoneFilterValue(product: Product): string {
  const guide = getStoneGuideForProduct(product);
  return guide?.coreStone ?? guide?.id ?? product.stone;
}

function productShankArtisanFilterKeys(product: Product): string[] {
  return getProductArtisanLinks(product)
    .filter((link) => link.role === "shank-designer")
    .map((link) => link.artisan.slug);
}

function productStoneArtisanFilterKeys(product: Product): string[] {
  return getProductArtisanLinks(product)
    .filter((link) => link.role === "stone-engraver")
    .map((link) => link.artisan.slug);
}

export function productMatchesStoneFilter(product: Product, selected: readonly string[]): boolean {
  if (selected.length === 0) return true;
  const keys = productStoneFilterKeys(product);
  return selected.some((value) => keys.includes(value));
}

export function productMatchesShankArtisanFilter(
  product: Product,
  selected: readonly string[]
): boolean {
  if (selected.length === 0) return true;
  const keys = productShankArtisanFilterKeys(product);
  return selected.some((value) => keys.includes(value));
}

export function productMatchesStoneArtisanFilter(
  product: Product,
  selected: readonly string[]
): boolean {
  if (selected.length === 0) return true;
  const keys = productStoneArtisanFilterKeys(product);
  return selected.some((value) => keys.includes(value));
}

export function applyShopFilters(
  catalog: Product[],
  filters: ShopFilters,
  options?: { skipQuery?: boolean }
): Product[] {
  const q = options?.skipQuery ? "" : filters.query.trim().toLowerCase();
  return catalog.filter((p) => {
    if (q && !matchesProductSearchQuery(p, q)) return false;
    if (!productMatchesStoneFilter(p, filters.stones)) return false;
    if (!productMatchesShankArtisanFilter(p, filters.shankArtisans)) return false;
    if (!productMatchesStoneArtisanFilter(p, filters.stoneArtisans)) return false;
    if (filters.styles.length > 0 && !filters.styles.includes(p.category)) return false;
    if (filters.engravingTypes.length > 0) {
      const matches = filters.engravingTypes.some((et) => {
        if (et === "none") return p.engravingType === "none";
        return p.engravingType === et;
      });
      if (!matches) return false;
    }
    if (filters.weightBands.length > 0) {
      const grams = p.weightGrams ?? (p.price <= 50_000_000 ? 7 : p.price <= 130_000_000 ? 12 : 17);
      const weightBand: ShopWeightBand = grams < 8 ? "light" : grams <= 15 ? "medium" : "heavy";
      if (!filters.weightBands.includes(weightBand)) return false;
    }
    if (filters.metalStamps.length > 0) {
      const stamp = (p.metalStamp as ShopMetalStamp | undefined) ?? "0.925";
      if (!filters.metalStamps.includes(stamp)) return false;
    }
    if (filters.budgetBands.length > 0) {
      const budgetBand: ShopBudgetBand =
        p.price <= 40_000_000
          ? "entry"
          : p.price <= 90_000_000
            ? "mid"
            : p.price <= 180_000_000
              ? "premium"
              : "luxury";
      if (!filters.budgetBands.includes(budgetBand)) return false;
    }
    if (filters.occasions.length > 0) {
      const productOccasions = p.occasions ?? defaultOccasionsByStyle[p.category] ?? [];
      if (!filters.occasions.some((occasion) => productOccasions.includes(occasion))) return false;
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
    if (filters.vendorOnly && !p.vendorId) return false;
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
const defaultOccasionsByStyle: Record<RingStyle, ProductOccasion[]> = {
  solitaire: ["engagement", "anniversary", "gift"],
  halo: ["engagement", "anniversary", "gift"],
  vintage: ["gift", "anniversary", "everyday"],
  signet: ["graduation", "gift", "everyday"],
  eternity: ["wedding", "anniversary"],
  stackable: ["gift", "birthday", "everyday"],
};

export function createDefaultShopFilters(maxPrice: number): ShopFilters {
  return {
    stones: [],
    shankArtisans: [],
    stoneArtisans: [],
    priceRange: [0, maxPrice],
    styles: [],
    engravingTypes: [],
    weightBands: [],
    metalStamps: [],
    budgetBands: [],
    occasions: [],
    availabilities: [],
    collections: [],
    collectionIds: [],
    conditions: [],
    query: "",
    vendorOnly: false,
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
const weightLabels: Record<ShopWeightBand, string> = {
  light: fa.shop.weightOptions.light,
  medium: fa.shop.weightOptions.medium,
  heavy: fa.shop.weightOptions.heavy,
};
const metalStampLabels: Record<ShopMetalStamp, string> = {
  "0.925": fa.shop.metalStampOptions["0.925"],
  "0.750": fa.shop.metalStampOptions["0.750"],
  "0.585": fa.shop.metalStampOptions["0.585"],
};
const budgetLabels: Record<ShopBudgetBand, string> = {
  entry: fa.shop.budgetOptions.entry,
  mid: fa.shop.budgetOptions.mid,
  premium: fa.shop.budgetOptions.premium,
  luxury: fa.shop.budgetOptions.luxury,
};
const occasionLabels: Record<ProductOccasion, string> = {
  engagement: fa.occasions.engagement,
  wedding: fa.occasions.wedding,
  anniversary: fa.occasions.anniversary,
  birthday: fa.occasions.birthday,
  gift: fa.occasions.gift,
  eid: fa.occasions.eid,
  religious: fa.occasions.religious,
  graduation: fa.occasions.graduation,
  everyday: fa.occasions.everyday,
};

export function countActiveFilters(filters: ShopFilters, maxPrice: number): number {
  let n = 0;
  n += filters.stones.length;
  n += filters.shankArtisans.length;
  n += filters.stoneArtisans.length;
  n += filters.styles.length;
  n += filters.engravingTypes.length;
  n += filters.weightBands.length;
  n += filters.metalStamps.length;
  n += filters.budgetBands.length;
  n += filters.occasions.length;
  n += filters.availabilities.length;
  n += filters.collections.length;
  n += filters.collectionIds.length;
  n += filters.conditions.length;
  if (filters.query.trim()) n += 1;
  if (filters.vendorOnly) n += 1;
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
  onChange: (next: ShopFilters) => void,
  catalog: Product[] = []
): FilterChip[] {
  const chips: FilterChip[] = [];
  const stoneLabels = new Map(buildCatalogStoneFilterOptions(catalog).map((option) => [option.value, option.label]));
  const shankArtisanLabels = new Map(
    buildCatalogShankArtisanFilterOptions(catalog).map((option) => [option.value, option.label])
  );
  const stoneArtisanLabels = new Map(
    buildCatalogStoneArtisanFilterOptions(catalog).map((option) => [option.value, option.label])
  );

  for (const stone of filters.stones) {
    const label = stoneLabels.get(stone) ?? STONE_OPTIONS.find((s) => s.value === stone)?.label ?? stone;
    chips.push({
      id: `stone-${stone}`,
      label: `${fa.shop.stone}: ${label}`,
      onRemove: () => onChange({ ...filters, stones: removeFromArray(filters.stones, stone) }),
    });
  }

  for (const artisan of filters.shankArtisans) {
    const label = shankArtisanLabels.get(artisan) ?? artisan;
    chips.push({
      id: `shank-artisan-${artisan}`,
      label: `${fa.shop.shankArtisan}: ${label}`,
      onRemove: () =>
        onChange({
          ...filters,
          shankArtisans: removeFromArray(filters.shankArtisans, artisan),
        }),
    });
  }

  for (const artisan of filters.stoneArtisans) {
    const label = stoneArtisanLabels.get(artisan) ?? artisan;
    chips.push({
      id: `stone-artisan-${artisan}`,
      label: `${fa.shop.stoneArtisan}: ${label}`,
      onRemove: () =>
        onChange({
          ...filters,
          stoneArtisans: removeFromArray(filters.stoneArtisans, artisan),
        }),
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
  for (const weight of filters.weightBands) {
    chips.push({
      id: `weight-${weight}`,
      label: `${fa.shop.weight}: ${weightLabels[weight]}`,
      onRemove: () =>
        onChange({ ...filters, weightBands: removeFromArray(filters.weightBands, weight) }),
    });
  }
  for (const stamp of filters.metalStamps) {
    chips.push({
      id: `metalStamp-${stamp}`,
      label: `${fa.shop.metalStamp}: ${metalStampLabels[stamp]}`,
      onRemove: () =>
        onChange({
          ...filters,
          metalStamps: removeFromArray(filters.metalStamps, stamp),
        }),
    });
  }
  for (const budget of filters.budgetBands) {
    chips.push({
      id: `budget-${budget}`,
      label: `${fa.shop.budget}: ${budgetLabels[budget]}`,
      onRemove: () =>
        onChange({ ...filters, budgetBands: removeFromArray(filters.budgetBands, budget) }),
    });
  }
  for (const occasion of filters.occasions) {
    chips.push({
      id: `occasion-${occasion}`,
      label: `${fa.shop.occasion}: ${occasionLabels[occasion]}`,
      onRemove: () =>
        onChange({ ...filters, occasions: removeFromArray(filters.occasions, occasion) }),
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

export const weightFilterOptions: { value: ShopWeightBand; label: string }[] = [
  { value: "light", label: fa.shop.weightOptions.light },
  { value: "medium", label: fa.shop.weightOptions.medium },
  { value: "heavy", label: fa.shop.weightOptions.heavy },
];

export const metalStampFilterOptions: { value: ShopMetalStamp; label: string }[] = [
  { value: "0.925", label: fa.shop.metalStampOptions["0.925"] },
  { value: "0.750", label: fa.shop.metalStampOptions["0.750"] },
  { value: "0.585", label: fa.shop.metalStampOptions["0.585"] },
];

export const budgetFilterOptions: { value: ShopBudgetBand; label: string }[] = [
  { value: "entry", label: fa.shop.budgetOptions.entry },
  { value: "mid", label: fa.shop.budgetOptions.mid },
  { value: "premium", label: fa.shop.budgetOptions.premium },
  { value: "luxury", label: fa.shop.budgetOptions.luxury },
];

export const occasionFilterOptions: { value: ProductOccasion; label: string }[] = [
  { value: "engagement", label: fa.occasions.engagement },
  { value: "wedding", label: fa.occasions.wedding },
  { value: "anniversary", label: fa.occasions.anniversary },
  { value: "birthday", label: fa.occasions.birthday },
  { value: "gift", label: fa.occasions.gift },
  { value: "eid", label: fa.occasions.eid },
  { value: "religious", label: fa.occasions.religious },
  { value: "graduation", label: fa.occasions.graduation },
  { value: "everyday", label: fa.occasions.everyday },
];

export function buildCatalogStoneFilterOptions(catalog: Product[]): CatalogFilterOption[] {
  const map = new Map<string, CatalogFilterOption>();

  for (const product of catalog) {
    const guide = getStoneGuideForProduct(product);
    const value = primaryProductStoneFilterValue(product);
    if (map.has(value)) continue;
    map.set(value, {
      value,
      label: guide?.name ?? fallbackStoneLabel(product.stone),
      swatch: guide?.colorHex ?? fallbackStoneSwatch(product.stone),
    });
  }

  return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, "fa"));
}

export function buildCatalogShankArtisanFilterOptions(catalog: Product[]): CatalogFilterOption[] {
  const map = new Map<string, CatalogFilterOption>();

  for (const product of catalog) {
    for (const link of getProductArtisanLinks(product)) {
      if (link.role !== "shank-designer") continue;
      if (map.has(link.artisan.slug)) continue;
      map.set(link.artisan.slug, {
        value: link.artisan.slug,
        label: link.artisan.name,
        image: link.artisan.image,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, "fa"));
}

export function buildCatalogStoneArtisanFilterOptions(catalog: Product[]): CatalogFilterOption[] {
  const map = new Map<string, CatalogFilterOption>();

  for (const product of catalog) {
    for (const link of getProductArtisanLinks(product)) {
      if (link.role !== "stone-engraver") continue;
      if (map.has(link.artisan.slug)) continue;
      map.set(link.artisan.slug, {
        value: link.artisan.slug,
        label: link.artisan.name,
        image: link.artisan.image,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, "fa"));
}

export const stoneFilterOptions = STONE_OPTIONS.map((s) => ({
  value: s.value,
  label: s.label,
  swatch: s.color,
}));

export const conditionFilterOptions: { value: ProductCondition; label: string }[] = [
  { value: "new", label: fa.shop.conditionOptions.new },
  { value: "pre-owned", label: fa.shop.conditionOptions.preOwned },
];
