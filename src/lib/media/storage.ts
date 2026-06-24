import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import type { AdminMediaCategory } from "@/lib/media/categories";
import {
  deleteMediaAsset,
  storeMediaAsset,
  type StoredMediaAsset,
} from "@/lib/server/media/store";
import { storeReviewImage } from "@/lib/server/media/review-upload";

export type UploadImageInput =
  | { kind: "admin"; file: File; category: AdminMediaCategory }
  | { kind: "review"; file: File };

export type UploadImageResult = {
  url: string;
  webpUrl?: string;
  asset?: StoredMediaAsset;
};

export type TransformImageOptions = {
  width?: number;
  quality?: number;
  format?: "webp" | "jpeg" | "png";
};

export async function uploadImage(input: UploadImageInput): Promise<UploadImageResult> {
  if (input.kind === "review") {
    const result = await storeReviewImage(input.file);
    return { url: result.url };
  }

  const asset = await storeMediaAsset({ file: input.file, category: input.category });
  return {
    url: asset.url,
    webpUrl: asset.webpUrl,
    asset,
  };
}

export async function deleteImage(publicUrl: string): Promise<void> {
  if (publicUrl.startsWith("/uploads/admin-media/")) {
    const filename = path.basename(publicUrl);
    const manifestId = filename.replace(/\.[^.]+$/, "");
    await deleteMediaAsset(manifestId);
    return;
  }

  const diskPath = path.join(process.cwd(), "public", publicUrl.replace(/^\//, ""));
  await fs.unlink(diskPath).catch(() => undefined);
}

export async function transformImage(
  bytes: Buffer,
  options: TransformImageOptions = {}
): Promise<Buffer> {
  const width = options.width ?? 1600;
  const quality = options.quality ?? 82;
  const format = options.format ?? "webp";

  let pipeline = sharp(bytes).rotate().resize({ width, withoutEnlargement: true });

  if (format === "webp") {
    return pipeline.webp({ quality }).toBuffer();
  }
  if (format === "jpeg") {
    return pipeline.jpeg({ quality }).toBuffer();
  }
  return pipeline.png().toBuffer();
}
