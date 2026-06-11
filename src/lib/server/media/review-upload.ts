import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const STORE_DIR = path.join(process.cwd(), "public", "uploads", "reviews");

export const REVIEW_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

function createId(): string {
  const seed = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return seed.replace(/[^a-z0-9-]/gi, "");
}

/**
 * Store a user-submitted review image as an optimised WebP under
 * `public/uploads/reviews` and return its public URL. Used by the
 * customer-facing review form (not admin media). Caller must enforce auth.
 */
export async function storeReviewImage(file: File): Promise<{ url: string }> {
  await fs.mkdir(STORE_DIR, { recursive: true });
  const id = createId();
  const webpFilename = `${id}.webp`;
  const webpDiskPath = path.join(STORE_DIR, webpFilename);

  const bytes = Buffer.from(await file.arrayBuffer());
  // Re-encode through sharp: normalises orientation, strips metadata, and
  // guarantees the output is a real image (rejects disguised non-images).
  await sharp(bytes)
    .rotate()
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(webpDiskPath);

  return { url: `/uploads/reviews/${webpFilename}` };
}
