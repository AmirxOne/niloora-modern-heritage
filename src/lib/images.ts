/**
 * Canonical local image paths served from /public.
 * Import asset URLs from this module only — do not hardcode paths in components.
 */

/** Hero and marketing photography */
export const SITE_HERO_RING_IMAGE = "/images/site/hero-ring-showcase.jpg";
export const SITE_ARTISAN_WORKSHOP_IMAGE = "/images/site/artisan-workshop.jpg";

/** Legacy aliases kept for existing imports */
export const SITE_IMAGE_1 = SITE_HERO_RING_IMAGE;
export const SITE_IMAGE_2 = SITE_ARTISAN_WORKSHOP_IMAGE;

export const SITE_IMAGES = [SITE_HERO_RING_IMAGE, SITE_ARTISAN_WORKSHOP_IMAGE] as const;

export const DEFAULT_PRODUCT_IMAGE = SITE_HERO_RING_IMAGE;
export const DEFAULT_OG_IMAGE_PATH = SITE_HERO_RING_IMAGE;

/** Alternate between the two site images by index or key */
export function pickSiteImage(index: number): string {
  return SITE_IMAGES[Math.abs(index) % SITE_IMAGES.length];
}

export function pickSiteImageByKey(key: string, offset = 0): string {
  let hash = offset;
  for (let i = 0; i < key.length; i++) hash += key.charCodeAt(i);
  return pickSiteImage(hash);
}

export const PRODUCT_GALLERY_IMAGES = [...SITE_IMAGES];

/** Ring customization — shank carving pattern previews */
export const RING_CARVING_PATTERN_FLORAL_IMAGE =
  "/images/customize/shank-carving-pattern-floral.png";
export const RING_CARVING_PATTERN_GEOMETRIC_IMAGE =
  "/images/customize/shank-carving-pattern-geometric.png";
export const RING_CARVING_PATTERN_HERITAGE_IMAGE =
  "/images/customize/shank-carving-pattern-heritage.png";

export const RING_CARVING_PATTERN_IMAGES = [
  RING_CARVING_PATTERN_FLORAL_IMAGE,
  RING_CARVING_PATTERN_GEOMETRIC_IMAGE,
  RING_CARVING_PATTERN_HERITAGE_IMAGE,
] as const;

export function pickCarvingPatternImage(index: number): string {
  return RING_CARVING_PATTERN_IMAGES[Math.abs(index) % RING_CARVING_PATTERN_IMAGES.length];
}

export function pickCarvingPatternImageByKey(key: string, offset = 0): string {
  let hash = offset;
  for (let i = 0; i < key.length; i++) hash += key.charCodeAt(i);
  return pickCarvingPatternImage(hash);
}

/** Artisan portrait placeholders */
export const ARTISAN_PORTRAIT_PRIMARY_IMAGE = "/images/artisans/test-portrait-primary.avif";
export const ARTISAN_PORTRAIT_SECONDARY_IMAGE = "/images/artisans/test-portrait-secondary.avif";

export const ARTISAN_PORTRAIT_IMAGES = [
  ARTISAN_PORTRAIT_PRIMARY_IMAGE,
  ARTISAN_PORTRAIT_SECONDARY_IMAGE,
] as const;

export function pickArtisanPortraitImage(index: number): string {
  return ARTISAN_PORTRAIT_IMAGES[Math.abs(index) % ARTISAN_PORTRAIT_IMAGES.length];
}

export function pickArtisanPortraitImageByKey(key: string, offset = 0): string {
  let hash = offset;
  for (let i = 0; i < key.length; i++) hash += key.charCodeAt(i);
  return pickArtisanPortraitImage(hash);
}

/** Brand mark */
export const BRAND_MARK_IMAGE = "/brand-mark.png";
export const BRAND_MARK_IMAGE_WITH_CACHE = "/brand-mark.png?v=20260603";

/** Empty-state illustrations */
export const EMPTY_STATE_COMPARE_IMAGE = "/empty-compare-jewel.svg";
export const EMPTY_STATE_CART_IMAGE = "/empty-cart-jewel.svg";
export const EMPTY_STATE_BLOG_IMAGE = "/empty-blog-jewel.svg";
export const EMPTY_STATE_REVIEWS_IMAGE = "/empty-reviews-jewel.svg";
export const EMPTY_STATE_QUESTIONS_IMAGE = "/empty-questions-jewel.svg";
export const EMPTY_STATE_ORDERS_IMAGE = "/empty-orders-jewel.svg";
export const EMPTY_STATE_SHOP_IMAGE = "/empty-shop-jewel.svg";

export const EMPTY_STATE_IMAGES = {
  compare: EMPTY_STATE_COMPARE_IMAGE,
  cart: EMPTY_STATE_CART_IMAGE,
  blog: EMPTY_STATE_BLOG_IMAGE,
  reviews: EMPTY_STATE_REVIEWS_IMAGE,
  questions: EMPTY_STATE_QUESTIONS_IMAGE,
  orders: EMPTY_STATE_ORDERS_IMAGE,
  shop: EMPTY_STATE_SHOP_IMAGE,
} as const;

export type EmptyStateVisual = keyof typeof EMPTY_STATE_IMAGES;

/** Renamed public assets — maps legacy filenames to canonical paths */
const LEGACY_PUBLIC_IMAGE_PATHS: Record<string, string> = {
  "/Picsart_26-04-26_15-15-33-128.jpg": SITE_HERO_RING_IMAGE,
  "/Picsart_26-04-26_15-17-47-470.jpg": SITE_ARTISAN_WORKSHOP_IMAGE,
  "/Gemini_Generated_Image_iay12tiay12tiay1.png": RING_CARVING_PATTERN_FLORAL_IMAGE,
  "/Gemini_Generated_Image_oqeph5oqeph5oqep.png": RING_CARVING_PATTERN_GEOMETRIC_IMAGE,
  "/Gemini_Generated_Image_x57gdxx57gdxx57g.png": RING_CARVING_PATTERN_HERITAGE_IMAGE,
  "/photo-1500648767791-00dcc994a43e.avif": ARTISAN_PORTRAIT_PRIMARY_IMAGE,
  "/photo-1472099645785-5658abf4ff4e.avif": ARTISAN_PORTRAIT_SECONDARY_IMAGE,
};

/** Resolve a stored public image path, rewriting legacy filenames after asset renames */
export function resolvePublicImagePath(
  path: string | null | undefined,
  fallback = DEFAULT_PRODUCT_IMAGE
): string {
  const trimmed = path?.trim();
  if (!trimmed) return fallback;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return LEGACY_PUBLIC_IMAGE_PATHS[trimmed] ?? trimmed;
}
