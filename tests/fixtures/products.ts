import type { Product, ShopFilters } from "@/lib/types";

export const sampleProduct: Product = {
  id: "ring-solitaire-01",
  name: "Solitaire Diamond Ring",
  namePersian: "انگشتر تک‌نگین الماس",
  listing: {
    tier: "premium",
    headline: "انگشتر نقره مردانه",
    details: ["نگین: الماس", "جنس: نقره استرلینگ"],
  },
  price: 85_000_000,
  listPrice: 100_000_000,
  discountPercent: 15,
  image: "/images/products/sample.jpg",
  category: "solitaire",
  metal: "sterling",
  stone: "diamond",
  stoneShape: "round",
  engravingType: "nastaliq",
  availability: "ready",
  stock: 1,
  featured: true,
  bestseller: false,
  collection: "Royal Heritage",
  collectionId: "royal-heritage",
  initialSalesCount: 5,
  condition: "new",
};

export const soldProduct: Product = {
  ...sampleProduct,
  id: "ring-sold-01",
  namePersian: "انگشتر فروخته‌شده",
  availability: "sold",
  stock: 0,
  price: 200_000_000,
};

export const haloProduct: Product = {
  ...sampleProduct,
  id: "ring-halo-01",
  namePersian: "انگشتر هاله",
  category: "halo",
  stone: "sapphire",
  price: 120_000_000,
  bestseller: true,
};

export function defaultShopFilters(overrides?: Partial<ShopFilters>): ShopFilters {
  return {
    stones: [],
    artisans: [],
    priceRange: [0, 500_000_000],
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
    ...overrides,
  };
}
