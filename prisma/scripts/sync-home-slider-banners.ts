/**
 * هم‌گام‌سازی اسلایدهای خانه با بنرهای slider-banners و ترتیب پیش‌فرض.
 * npx tsx prisma/scripts/sync-home-slider-banners.ts
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import {
  HOME_SLIDER_BANNER_PRODUCT_IDS,
  resolveSliderBannerUrl,
} from "../../src/lib/home/slider-banner-images";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  for (let sortOrder = 0; sortOrder < HOME_SLIDER_BANNER_PRODUCT_IDS.length; sortOrder++) {
    const productId = HOME_SLIDER_BANNER_PRODUCT_IDS[sortOrder];
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!product) {
      console.warn(`skip ${productId}: product not in catalog`);
      continue;
    }

    const bannerImageUrl = resolveSliderBannerUrl(productId, null);
    const existing = await prisma.homeSliderItem.findUnique({ where: { productId } });

    if (existing) {
      await prisma.homeSliderItem.update({
        where: { productId },
        data: {
          sortOrder,
          active: true,
          ...(bannerImageUrl && !existing.bannerImageUrl ? { bannerImageUrl } : {}),
        },
      });
      console.log(`updated ${productId} (sort ${sortOrder})`);
    } else {
      await prisma.homeSliderItem.create({
        data: {
          productId,
          sortOrder,
          active: true,
          bannerImageUrl,
        },
      });
      console.log(`created ${productId} (sort ${sortOrder})`);
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
