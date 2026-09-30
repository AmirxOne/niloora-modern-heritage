/**
 * ساخت محصولات از تصاویر catalog-import (472 محصول از 473 تصویر).
 * هر پوشه/پیشوند product_NNNN یک محصول است؛ تصویر اول = تصویر اصلی، بقیه در ProductImage.
 *
 * npx tsx prisma/scripts/seed-catalog-import.ts [--limit=50] [--dry-run]
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" });
const prisma = new PrismaClient({ adapter });

const IMG_DIR = path.join(process.cwd(), "public", "images", "products", "catalog-import");
const PUBLIC_PREFIX = "/images/products/catalog-import";

// مقادیر مجاز از src/lib/types.ts
const CATEGORIES = ["signet", "solitaire", "halo", "vintage", "eternity", "stackable"] as const;
const METALS = ["sterling", "oxidized", "rhodium", "matte-silver"] as const;
const STONES = ["turquoise", "diamond", "emerald", "sapphire", "ruby", "onyx", "zabarjad", "yemen-aqeeq", "durr-najaf", "moral"] as const;
const SHAPES = ["round", "oval", "cushion", "princess", "pear", "marquise"] as const;
const ENGRAVINGS = ["nastaliq", "naskh", "thuluth", "kufic", "modern", "none"] as const;
const AVAILABILITIES = ["ready", "preorder", "made-to-order", "luxury"] as const; // sold نه — قابل خرید باشد

// نام‌های فارسی طبیعی برای تنوع (قابل‌قبول برای فروشگاه واقعی)
const NAME_PARTS_A = ["انگشتر", "حلقه", "نگین", "دست‌ساز", "میراث", "اصیل", "نوبل", "شاهانه", "زیبا", "کلاسیک"];
const NAME_PARTS_B = ["فیروزه", "الماس", "زمرد", "یاقوت", "عقیق", "دُرّ نجف", "زرّین", "نقره‌ای", "کهن", "درخشان"];
const NAME_PARTS_C = ["اصفهان", "شیراز", "تبریز", "کرمان", "یزد", "مشرق", "غروب", "بهار", "پارس", "ایلام"];

const COLLECTIONS = [
  { id: "royal-heritage", label: "مجموعه میراث سلطنتی" },
  { id: "ancient-dynasty", label: "مجموعه دودمان کهن" },
  { id: "modern-nobility", label: "مجموعه نجیب‌زادگی معاصر" },
];

// تنوع درقیمت — بازه واقعی فروشگاه (تومان)
const PRICE_TIERS = [
  8_500_000, 12_000_000, 15_500_000, 18_000_000, 22_500_000, 28_000_000,
  35_000_000, 45_000_000, 58_000_000, 72_000_000, 95_000_000, 124_000_000,
];

/** deterministic pseudo-random از شماره محصول — نتیجه هر بار یکسان */
function seeded(index: number, offset: number, mod: number): number {
  const x = Math.sin(index * 9301 + offset * 49297) * 233280;
  return Math.abs(Math.floor(x)) % mod;
}

function buildProduct(num: number) {
  const idx = num - 1;
  const category = CATEGORIES[seeded(idx, 1, CATEGORIES.length)];
  const metal = METALS[seeded(idx, 2, METALS.length)];
  const stone = STONES[seeded(idx, 3, STONES.length)];
  const shape = SHAPES[seeded(idx, 4, SHAPES.length)];
  const engraving = ENGRAVINGS[seeded(idx, 5, ENGRAVINGS.length)];
  const availability = AVAILABILITIES[seeded(idx, 6, AVAILABILITIES.length)];
  const collection = COLLECTIONS[seeded(idx, 7, COLLECTIONS.length)];

  const partA = NAME_PARTS_A[seeded(idx, 8, NAME_PARTS_A.length)];
  const partB = NAME_PARTS_B[seeded(idx, 9, NAME_PARTS_B.length)];
  const partC = NAME_PARTS_C[seeded(idx, 10, NAME_PARTS_C.length)];

  const basePrice = PRICE_TIERS[seeded(idx, 11, PRICE_TIERS.length)];
  // ۶۰٪ بدون تخفیف؛ ۴۰٪ با تخفیف ۵–۲۵٪
  const hasDiscount = seeded(idx, 12, 10) < 4;
  const discountPercent = hasDiscount ? 5 + seeded(idx, 13, 21) : null;
  const listPrice = hasDiscount && discountPercent
    ? Math.round(basePrice / (1 - discountPercent / 100))
    : null;

  const faName = `${partA} ${partB} «${partC}»`;
  const enName = `Heritage Ring ${String(num).padStart(4, "0")}`;
  const id = `catalog-${String(num).padStart(4, "0")}`;

  return {
    id,
    name: enName,
    namePersian: `${faName} — ${collection.label}`,
    price: basePrice,
    listPrice,
    discountPercent,
    category,
    metal,
    stone,
    stoneShape: shape,
    engravingType: engraving,
    availability,
    stock: availability === "ready" ? 1 + seeded(idx, 14, 5) : 1,
    condition: "new",
    collectionId: collection.id,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : Infinity;

  const files = (await readdir(IMG_DIR)).filter((f) => /\.jpe?g$/i.test(f)).sort();
  // گروه‌بندی بر اساس شماره محصول: product_0020_01.jpg → 20
  const groups = new Map<number, string[]>();
  for (const f of files) {
    const m = /^product_(\d{4})_(\d{2})\.jpe?g$/i.exec(f);
    if (!m) continue;
    const num = Number(m[1]);
    if (!groups.has(num)) groups.set(num, []);
    groups.get(num)!.push(f);
  }
  const nums: number[] = Array.from(groups.keys()).sort((a, b) => a - b).slice(0, limit === Infinity ? undefined : limit);
  console.log(`found ${files.length} images → ${nums.length} products`);

  let created = 0, skipped = 0;
  for (const num of nums) {
    const images = groups.get(num)!.sort();
    const p = buildProduct(num);
    const mainImage = `${PUBLIC_PREFIX}/${images[0]}`;

    const existing = await prisma.product.findUnique({ where: { id: p.id }, select: { id: true } });
    if (existing) { skipped += 1; continue; }

    if (!dryRun) {
      await prisma.$transaction(async (tx) => {
        await tx.product.create({
          data: {
            ...p,
            image: mainImage,
            publicationStatus: "published",
          },
        });
        // تصاویر اضافه (اگر محصول بیش از یک عکس دارد)
        const extras = images.slice(1);
        if (extras.length > 0) {
          await tx.productImage.createMany({
            data: extras.map((f, i) => ({
              productId: p.id,
              url: `${PUBLIC_PREFIX}/${f}`,
              sortOrder: i + 1,
            })),
          });
        }
      });
    }
    created += 1;
    if (created % 100 === 0) console.log(`  ...${created}`);
  }

  console.log(`done: ${created} created, ${skipped} skipped (already exist)${dryRun ? " [dry-run]" : ""}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
