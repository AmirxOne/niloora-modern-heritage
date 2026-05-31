/** Local product imagery — files in /public */
export const SITE_IMAGE_1 = "/Picsart_26-04-26_15-15-33-128.jpg";
export const SITE_IMAGE_2 = "/Picsart_26-04-26_15-17-47-470.jpg";

export const SITE_IMAGES = [SITE_IMAGE_1, SITE_IMAGE_2] as const;

export const DEFAULT_PRODUCT_IMAGE = SITE_IMAGE_1;

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

/** Temporary test avatars for artisans/designers */
export const TEST_ARTISAN_IMAGE_1 = "/photo-1500648767791-00dcc994a43e.avif";
export const TEST_ARTISAN_IMAGE_2 = "/photo-1472099645785-5658abf4ff4e.avif";
export const TEST_ARTISAN_IMAGES = [TEST_ARTISAN_IMAGE_1, TEST_ARTISAN_IMAGE_2] as const;

export function pickTestArtisanImage(index: number): string {
  return TEST_ARTISAN_IMAGES[Math.abs(index) % TEST_ARTISAN_IMAGES.length];
}

export function pickTestArtisanImageByKey(key: string, offset = 0): string {
  let hash = offset;
  for (let i = 0; i < key.length; i++) hash += key.charCodeAt(i);
  return pickTestArtisanImage(hash);
}

/** Temporary test pattern images for shank carving */
export const TEST_CARVING_PATTERN_IMAGE_1 = "/Gemini_Generated_Image_iay12tiay12tiay1.png";
export const TEST_CARVING_PATTERN_IMAGE_2 = "/Gemini_Generated_Image_oqeph5oqeph5oqep.png";
export const TEST_CARVING_PATTERN_IMAGE_3 = "/Gemini_Generated_Image_x57gdxx57gdxx57g.png";
export const TEST_CARVING_PATTERN_IMAGES = [
  TEST_CARVING_PATTERN_IMAGE_1,
  TEST_CARVING_PATTERN_IMAGE_2,
  TEST_CARVING_PATTERN_IMAGE_3,
] as const;

export function pickTestCarvingPatternImage(index: number): string {
  return TEST_CARVING_PATTERN_IMAGES[Math.abs(index) % TEST_CARVING_PATTERN_IMAGES.length];
}

export function pickTestCarvingPatternImageByKey(key: string, offset = 0): string {
  let hash = offset;
  for (let i = 0; i < key.length; i++) hash += key.charCodeAt(i);
  return pickTestCarvingPatternImage(hash);
}
