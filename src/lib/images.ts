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
