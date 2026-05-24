import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { isAdminMediaCategory, type AdminMediaCategory } from "@/lib/media/categories";

export type StoredMediaAsset = {
  id: string;
  category: AdminMediaCategory;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  url: string;
  webpUrl?: string;
  createdAt: string;
};

const STORE_DIR = path.join(process.cwd(), "public", "uploads", "admin-media");
const MANIFEST_PATH = path.join(STORE_DIR, "manifest.json");

function normalizeFilename(name: string): string {
  const base = name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9._-]/g, "");
  return base || "file";
}

function createId(): string {
  const seed = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return seed.replace(/[^a-z0-9-]/gi, "");
}

async function ensureStoreDir() {
  await fs.mkdir(STORE_DIR, { recursive: true });
}

async function readManifest(): Promise<StoredMediaAsset[]> {
  await ensureStoreDir();
  try {
    const raw = await fs.readFile(MANIFEST_PATH, "utf8");
    const parsed = JSON.parse(raw) as StoredMediaAsset[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

async function writeManifest(items: StoredMediaAsset[]) {
  await ensureStoreDir();
  await fs.writeFile(MANIFEST_PATH, JSON.stringify(items, null, 2), "utf8");
}

export async function listMediaAssets(category?: string): Promise<StoredMediaAsset[]> {
  const items = await readManifest();
  const filtered = category && isAdminMediaCategory(category) ? items.filter((item) => item.category === category) : items;
  return filtered.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export async function deleteMediaAsset(id: string): Promise<boolean> {
  const items = await readManifest();
  const target = items.find((item) => item.id === id);
  if (!target) return false;

  const next = items.filter((item) => item.id !== id);
  await writeManifest(next);

  const originalPath = path.join(process.cwd(), "public", target.url.replace(/^\//, ""));
  const webpPath = target.webpUrl
    ? path.join(process.cwd(), "public", target.webpUrl.replace(/^\//, ""))
    : null;

  await fs.unlink(originalPath).catch(() => undefined);
  if (webpPath) await fs.unlink(webpPath).catch(() => undefined);
  return true;
}

export async function storeMediaAsset(input: {
  file: File;
  category: AdminMediaCategory;
}): Promise<StoredMediaAsset> {
  await ensureStoreDir();
  const id = createId();
  const originalName = normalizeFilename(input.file.name);
  const ext = path.extname(originalName) || ".bin";
  const originalFilename = `${id}${ext}`;
  const webpFilename = `${id}.webp`;
  const originalDiskPath = path.join(STORE_DIR, originalFilename);
  const webpDiskPath = path.join(STORE_DIR, webpFilename);

  const bytes = Buffer.from(await input.file.arrayBuffer());
  await fs.writeFile(originalDiskPath, bytes);

  let width: number | undefined;
  let height: number | undefined;
  let webpUrl: string | undefined;
  try {
    const image = sharp(bytes);
    const meta = await image.metadata();
    width = meta.width;
    height = meta.height;
    await image.webp({ quality: 82 }).toFile(webpDiskPath);
    webpUrl = `/uploads/admin-media/${webpFilename}`;
  } catch {
    webpUrl = undefined;
  }

  const asset: StoredMediaAsset = {
    id,
    category: input.category,
    originalName: input.file.name,
    mimeType: input.file.type || "application/octet-stream",
    sizeBytes: bytes.byteLength,
    width,
    height,
    url: `/uploads/admin-media/${originalFilename}`,
    webpUrl,
    createdAt: new Date().toISOString(),
  };

  const items = await readManifest();
  items.push(asset);
  await writeManifest(items);
  return asset;
}
