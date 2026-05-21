const KEYS = {
  cart: "hasib-cart",
  wishlist: "hasib-wishlist",
  designs: "hasib-designs",
  promo: "hasib-promo",
  comments: "hasib-comments",
  productSales: "hasib-product-sales",
  compareList: "hasib-compare",
  recentlyViewed: "hasib-recently-viewed",
} as const;

export function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function saveJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota errors */
  }
}

export const storageKeys = KEYS;
