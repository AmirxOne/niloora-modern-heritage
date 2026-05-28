import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import fs from "node:fs/promises";
import path from "node:path";

type SourcePhoto = { full?: string | null };
type SourceAttrs = {
  title?: string | null;
  category?: string | null;
  subtype?: string | null;
  gender?: string | null;
  material?: string | null;
  product_code?: string | null;
  date_iso?: string | null;
  date_jalali?: string | null;
  date_time?: string | null;
  ring_shank?: { maker?: string | null; stamp?: string | null; handmade?: boolean | null } | null;
  engraving?: {
    artist?: string | null;
    text?: string | null;
    handmade?: boolean | null;
    signed?: boolean | null;
  } | null;
  back_engraving?: string | null;
  stone?: { type?: string | null; color?: string | null; origin?: string | null; quality?: string | null } | null;
  size?: string | null;
  notes?: string | null;
};

type SourceMessage = {
  id?: number;
  albumId?: number;
  date?: string | null;
  text?: string | null;
  tags?: string[] | null;
  photos?: SourcePhoto[] | null;
  video?: string | null;
  attrs?: SourceAttrs | null;
};

type GroupedProduct = {
  albumId: number;
  messages: SourceMessage[];
};

type ImportStats = {
  albumsTotal: number;
  upsertedProducts: number;
  skippedProducts: number;
  skippedNoPhoto: number;
  copiedImages: number;
  missingImageFiles: number;
  imageRowsCreated: number;
  listingRowsUpserted: number;
  errors: Array<{ albumId: number; reason: string }>;
};

const SOURCE_JSON =
  process.argv[2] ?? "C:/data/catalog-import/messages.json";
const SOURCE_PHOTOS_DIR =
  process.argv[3] ?? "C:/data/catalog-import/photos";
const TARGET_PUBLIC_DIR = path.resolve("public/images/products/catalog-import");
const DEFAULT_PRICE = 0;

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePersianDigits(input: string): string {
  return input.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
}

function parsePhotoOrder(filePath: string): number {
  const base = path.basename(filePath);
  const m = base.match(/_(\d+)\.(jpg|jpeg|png|webp)$/i);
  return m ? Number.parseInt(m[1] ?? "9999", 10) : 9999;
}

function stableProductId(albumId: number): string {
  return `hannan-${String(albumId).padStart(4, "0")}`;
}

function normalizeCategory(input: string): "solitaire" | "halo" | "vintage" | "signet" | "eternity" | "stackable" {
  const t = clean(input).toLowerCase();
  if (t.includes("مهر") || t.includes("signet")) return "signet";
  if (t.includes("هاله") || t.includes("halo")) return "halo";
  if (t.includes("ابدیت") || t.includes("eternity")) return "eternity";
  if (t.includes("استک") || t.includes("چند") || t.includes("stack")) return "stackable";
  if (t.includes("وینتیج") || t.includes("vintage") || t.includes("کلاسیک")) return "vintage";
  return "solitaire";
}

function normalizeMetal(input: string): "sterling" | "oxidized" | "rhodium" | "matte-silver" {
  const t = clean(input).toLowerCase();
  if (t.includes("رودیوم") || t.includes("rhodium")) return "rhodium";
  if (t.includes("اکسید") || t.includes("تیره") || t.includes("سیاه")) return "oxidized";
  if (t.includes("مات") || t.includes("brushed")) return "matte-silver";
  return "sterling";
}

function normalizeStone(typeInput: string, originInput: string): "diamond" | "emerald" | "sapphire" | "ruby" | "turquoise" | "onyx" | "zabarjad" | "yemen-aqeeq" | "durr-najaf" | "moral" {
  const t = clean(typeInput).toLowerCase();
  const o = clean(originInput).toLowerCase();
  const all = `${t} ${o}`;
  if (all.includes("الماس") || all.includes("diamond")) return "diamond";
  if (all.includes("زمرد") || all.includes("emerald")) return "emerald";
  if (all.includes("یاقوت") || all.includes("sapphire")) return all.includes("سرخ") ? "ruby" : "sapphire";
  if (all.includes("فیروزه") || all.includes("turquoise")) return "turquoise";
  if (all.includes("زبرجد") || all.includes("zabarjad")) return "zabarjad";
  if (all.includes("در نجف") || all.includes("دُر نجف") || all.includes("durr")) return "durr-najaf";
  if (all.includes("مرمر") || all.includes("مُر") || all.includes("moral")) return "moral";
  if (all.includes("جزع") || all.includes("اونیکس") || all.includes("عقیق سیاه") || all.includes("onyx"))
    return "onyx";
  if (all.includes("یمن") || all.includes("عقیق") || all.includes("کرزی")) return "yemen-aqeeq";
  return "yemen-aqeeq";
}

function normalizeEngravingType(input: string): "nastaliq" | "naskh" | "thuluth" | "kufic" | "modern" | "none" {
  const t = clean(input).toLowerCase();
  if (!t) return "none";
  if (t.includes("نستعلیق")) return "nastaliq";
  if (t.includes("نسخ")) return "naskh";
  if (t.includes("ثلث")) return "thuluth";
  if (t.includes("کوفی")) return "kufic";
  return "modern";
}

function normalizeAvailability(input: string): "ready" | "preorder" | "sold" | "luxury" | "made-to-order" {
  const t = clean(input).toLowerCase();
  if (t.includes("فروخته") || t.includes("sold")) return "sold";
  if (t.includes("پیش")) return "preorder";
  if (t.includes("فاخر") || t.includes("lux")) return "luxury";
  if (t.includes("سفارش") || t.includes("made")) return "made-to-order";
  return "ready";
}

function safeIso(input: string): Date | null {
  const value = clean(input);
  if (!value) return null;
  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

async function readSourceMessages(filePath: string): Promise<SourceMessage[]> {
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) throw new Error("messages.json must be an array.");
  return parsed as SourceMessage[];
}

function groupByAlbum(messages: SourceMessage[]): GroupedProduct[] {
  const bucket = new Map<number, SourceMessage[]>();
  for (const msg of messages) {
    const albumId = typeof msg.albumId === "number" ? msg.albumId : null;
    if (!albumId) continue;
    if (!bucket.has(albumId)) bucket.set(albumId, []);
    bucket.get(albumId)?.push(msg);
  }
  return Array.from(bucket.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([albumId, rows]) => ({ albumId, messages: rows }));
}

function getMergedTags(group: GroupedProduct): string[] {
  const set = new Set<string>();
  for (const m of group.messages) {
    for (const tag of m.tags ?? []) {
      const v = clean(tag);
      if (v) set.add(v);
    }
  }
  return Array.from(set);
}

function getAllPhotoRelPaths(group: GroupedProduct): string[] {
  const set = new Set<string>();
  for (const m of group.messages) {
    for (const p of m.photos ?? []) {
      const rel = clean(p.full);
      if (rel) set.add(rel.replaceAll("\\", "/"));
    }
  }
  return Array.from(set).sort((a, b) => parsePhotoOrder(a) - parsePhotoOrder(b));
}

function buildListingDetails(attrs: SourceAttrs | null | undefined, tags: string[]): string[] {
  const lines: string[] = [];
  const title = clean(attrs?.title);
  const category = clean(attrs?.category);
  const subtype = clean(attrs?.subtype);
  const material = clean(attrs?.material);
  const stoneType = clean(attrs?.stone?.type);
  const stoneColor = clean(attrs?.stone?.color);
  const stoneOrigin = clean(attrs?.stone?.origin);
  const maker = clean(attrs?.ring_shank?.maker);
  const engravingArtist = clean(attrs?.engraving?.artist);
  const engravingText = clean(attrs?.engraving?.text);
  const back = clean(attrs?.back_engraving);
  const size = clean(attrs?.size);
  const notes = clean(attrs?.notes);
  const dateJalali = clean(attrs?.date_jalali);

  if (title) lines.push(`عنوان: ${title}`);
  if (category) lines.push(`دسته: ${category}${subtype ? ` / ${subtype}` : ""}`);
  if (material) lines.push(`جنس: ${material}`);
  if (stoneType || stoneColor || stoneOrigin) {
    lines.push(`نگین: ${[stoneType, stoneColor, stoneOrigin].filter(Boolean).join(" - ")}`);
  }
  if (maker) lines.push(`رکاب: ${maker}`);
  if (engravingArtist) lines.push(`حکاک: ${engravingArtist}`);
  if (engravingText) lines.push(`ذکر: ${engravingText}`);
  if (back) lines.push(`پشت حکاکی: ${back}`);
  if (size) lines.push(`سایز: ${normalizePersianDigits(size)}`);
  if (notes) lines.push(`یادداشت: ${notes}`);
  if (dateJalali) lines.push(`تاریخ ثبت: ${dateJalali}`);
  if (tags.length > 0) lines.push(`تگ‌ها: ${tags.join(" | ")}`);
  return lines.slice(0, 12);
}

async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL is missing. Set it in env before running import.");
  }

  const adapter = new PrismaPg({ connectionString: dbUrl });
  const prisma = new PrismaClient({ adapter });
  const stats: ImportStats = {
    albumsTotal: 0,
    upsertedProducts: 0,
    skippedProducts: 0,
    skippedNoPhoto: 0,
    copiedImages: 0,
    missingImageFiles: 0,
    imageRowsCreated: 0,
    listingRowsUpserted: 0,
    errors: [],
  };
  const copiedTarget = new Set<string>();

  try {
    await ensureDir(TARGET_PUBLIC_DIR);
    const messages = await readSourceMessages(SOURCE_JSON);
    const grouped = groupByAlbum(messages);
    stats.albumsTotal = grouped.length;

    for (const group of grouped) {
      const albumId = group.albumId;
      const productId = stableProductId(albumId);
      const first = group.messages[0];
      const attrs = first?.attrs ?? null;
      const tags = getMergedTags(group);
      const relPhotos = getAllPhotoRelPaths(group);
      const copiedUrls: string[] = [];

      for (const rel of relPhotos) {
        const source = rel.startsWith("photos/")
          ? path.join(SOURCE_PHOTOS_DIR, path.basename(rel))
          : path.resolve(path.dirname(SOURCE_JSON), rel);
        const fileName = path.basename(source);
        const targetAbs = path.join(TARGET_PUBLIC_DIR, fileName);
        const targetRel = `/images/products/catalog-import/${fileName}`;
        try {
          await fs.access(source);
        } catch {
          stats.missingImageFiles += 1;
          continue;
        }
        if (!copiedTarget.has(targetAbs)) {
          await fs.copyFile(source, targetAbs);
          copiedTarget.add(targetAbs);
          stats.copiedImages += 1;
        }
        copiedUrls.push(targetRel);
      }

      if (copiedUrls.length === 0) {
        stats.skippedProducts += 1;
        stats.skippedNoPhoto += 1;
        stats.errors.push({ albumId, reason: "No valid image found for album." });
        continue;
      }

      const title = clean(attrs?.title) || clean(first?.text).split("\n").find((x) => clean(x)) || `محصول ${albumId}`;
      const material = clean(attrs?.material);
      const stoneType = clean(attrs?.stone?.type);
      const stoneOrigin = clean(attrs?.stone?.origin);
      const engravingText = clean(attrs?.engraving?.text);
      const dateIso = clean(attrs?.date_iso) || clean(first?.date);
      const discountEndsAt = safeIso(dateIso);
      const availability = normalizeAvailability(`${tags.join(" ")} ${first?.text ?? ""}`);
      const stock = availability === "sold" ? 0 : 1;
      const featured = tags.some((t) => t.includes("فاخر") || t.includes("ویژه"));

      await prisma.$transaction(async (tx) => {
        await tx.product.upsert({
          where: { id: productId },
          create: {
            id: productId,
            name: `hannan-${String(albumId).padStart(4, "0")}`,
            namePersian: title,
            introVideoUrl: clean(first?.video) || null,
            price: DEFAULT_PRICE,
            listPrice: null,
            discountPercent: null,
            image: copiedUrls[0] ?? "/imports/hannan/placeholder.jpg",
            category: normalizeCategory(`${attrs?.category ?? ""} ${attrs?.subtype ?? ""}`),
            metal: normalizeMetal(material),
            stone: normalizeStone(stoneType, stoneOrigin),
            stoneShape: "oval",
            engravingType: normalizeEngravingType(engravingText),
            availability,
            stock,
            condition: "new",
            featured,
            bestseller: false,
            initialSalesCount: 0,
            collectionId: null,
            discountEndsAt,
          },
          update: {
            namePersian: title,
            introVideoUrl: clean(first?.video) || null,
            image: copiedUrls[0] ?? "/imports/hannan/placeholder.jpg",
            category: normalizeCategory(`${attrs?.category ?? ""} ${attrs?.subtype ?? ""}`),
            metal: normalizeMetal(material),
            stone: normalizeStone(stoneType, stoneOrigin),
            engravingType: normalizeEngravingType(engravingText),
            availability,
            stock,
            featured,
            discountEndsAt,
          },
        });

        await tx.productListing.upsert({
          where: { productId },
          create: {
            productId,
            tier: featured ? "premium" : "economy",
            headline: title,
            details: buildListingDetails(attrs, tags),
            extraTags: [],
          },
          update: {
            tier: featured ? "premium" : "economy",
            headline: title,
            details: buildListingDetails(attrs, tags),
            extraTags: [],
          },
        });
        stats.listingRowsUpserted += 1;

        await tx.productImage.deleteMany({ where: { productId } });
        await tx.productImage.createMany({
          data: copiedUrls.map((url, idx) => ({
            productId,
            url,
            sortOrder: idx + 1,
          })),
        });
        stats.imageRowsCreated += copiedUrls.length;
      });

      stats.upsertedProducts += 1;
    }

    console.log(
      JSON.stringify(
        {
          sourceJson: SOURCE_JSON,
          sourcePhotosDir: SOURCE_PHOTOS_DIR,
          targetPublicDir: TARGET_PUBLIC_DIR,
          ...stats,
        },
        null,
        2
      )
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("[import-hannan-catalog] failed:", error);
  process.exit(1);
});
