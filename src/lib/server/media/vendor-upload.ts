import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const STORE_ROOT = path.join(process.cwd(), "public", "uploads", "vendor-media");
const MANIFEST_PATH = path.join(STORE_ROOT, "manifest.json");

export const VENDOR_MEDIA_MAX_BYTES = 8 * 1024 * 1024;
export const VENDOR_MEDIA_MIN_WIDTH = 64;
export const VENDOR_MEDIA_MIN_HEIGHT = 64;
export const VENDOR_MEDIA_MAX_WIDTH = 8000;
export const VENDOR_MEDIA_MAX_HEIGHT = 8000;

export type StoredVendorMediaAsset = {
  id: string;
  vendorId: string;
  uploadedByUserId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  width: number;
  height: number;
  url: string;
  createdAt: string;
};

function createId(): string {
  const seed = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return seed.replace(/[^a-z0-9-]/gi, "");
}

function normalizeSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase() || "vendor";
}

async function ensureVendorDir(vendorId: string): Promise<string> {
  const vendorDir = path.join(STORE_ROOT, normalizeSegment(vendorId));
  await fs.mkdir(vendorDir, { recursive: true });
  return vendorDir;
}

async function readManifest(): Promise<StoredVendorMediaAsset[]> {
  try {
    const raw = await fs.readFile(MANIFEST_PATH, "utf8");
    const parsed = JSON.parse(raw) as StoredVendorMediaAsset[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeManifest(items: StoredVendorMediaAsset[]): Promise<void> {
  await fs.mkdir(STORE_ROOT, { recursive: true });
  await fs.writeFile(MANIFEST_PATH, JSON.stringify(items, null, 2), "utf8");
}

export async function storeVendorMediaAsset(input: {
  vendorId: string;
  uploadedByUserId: string;
  file: File;
}): Promise<StoredVendorMediaAsset> {
  const bytes = Buffer.from(await input.file.arrayBuffer());
  const image = sharp(bytes).rotate();
  const metadata = await image.metadata();

  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  if (
    width < VENDOR_MEDIA_MIN_WIDTH ||
    height < VENDOR_MEDIA_MIN_HEIGHT ||
    width > VENDOR_MEDIA_MAX_WIDTH ||
    height > VENDOR_MEDIA_MAX_HEIGHT
  ) {
    throw new Error("VENDOR_MEDIA_INVALID_DIMENSIONS");
  }

  const id = createId();
  const vendorDir = await ensureVendorDir(input.vendorId);
  const webpFilename = `${id}.webp`;
  const diskPath = path.join(vendorDir, webpFilename);

  await image.resize({ width: 2000, withoutEnlargement: true }).webp({ quality: 82 }).toFile(diskPath);

  const url = `/uploads/vendor-media/${normalizeSegment(input.vendorId)}/${webpFilename}`;
  const asset: StoredVendorMediaAsset = {
    id,
    vendorId: input.vendorId,
    uploadedByUserId: input.uploadedByUserId,
    originalName: input.file.name,
    mimeType: input.file.type || "application/octet-stream",
    sizeBytes: bytes.byteLength,
    width,
    height,
    url,
    createdAt: new Date().toISOString(),
  };

  const manifest = await readManifest();
  manifest.push(asset);
  await writeManifest(manifest);
  return asset;
}
