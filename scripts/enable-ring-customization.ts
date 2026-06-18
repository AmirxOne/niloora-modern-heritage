import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { normalizePieceCode } from "@/lib/products/piece-code";

/**
 * فعال‌سازی «شخصی‌سازی خرید» (ring customization) برای یک اثر مشخص.
 *
 * استفاده:
 *   tsx --env-file=.env.local scripts/enable-ring-customization.ts NL-RGM-3908
 *
 * شناسهٔ محصول در دیتابیس همان «شناسهٔ اثر» (piece code) است، بنابراین کد ورودی
 * مستقیماً برابر productId است.
 */

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "",
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const rawCode = process.argv[2];
  if (!rawCode) {
    throw new Error("شناسهٔ اثر را به‌عنوان آرگومان بدهید. مثال: NL-RGM-3908");
  }

  const productId = normalizePieceCode(rawCode);

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, namePersian: true },
  });

  if (!product) {
    throw new Error(`محصولی با شناسهٔ «${productId}» یافت نشد.`);
  }

  const config = await prisma.productRingCustomizationConfig.upsert({
    where: { productId },
    create: { productId, enabled: true },
    update: { enabled: true },
    select: { id: true, enabled: true, productId: true },
  });

  console.info(
    `[enable-ring-customization] شخصی‌سازی برای «${product.namePersian}» (${config.productId}) فعال شد. enabled=${config.enabled}`
  );
}

main()
  .catch((error) => {
    console.error("[enable-ring-customization] failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
