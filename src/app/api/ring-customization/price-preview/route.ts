export { dynamic } from "@/lib/server/route-segment";

import { badRequest, ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { resolvePieceCode } from "@/lib/products/piece-code";
import { calculateRingPurchaseCustomization } from "@/lib/ring-purchase-customization/pricing";
import { prisma } from "@/lib/server/prisma";
import { getOrCreateRingCustomizationConfig, listRingCustomizationCatalog } from "@/lib/server/ring-customization/service";

type Body = {
  productId?: string;
  size?: { selected?: number };
  shank?: { state?: "unchanged" | "customized" | "opted_out"; artisanId?: string; patternId?: string };
  stone?: {
    state?: "unchanged" | "customized" | "opted_out";
    artisanId?: string;
    textId?: string;
    scriptStyleId?: string;
  };
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Body;
    if (!payload.productId) return badRequest("شناسه محصول الزامی است.");

    const [configResult, catalog, product] = await Promise.all([
      getOrCreateRingCustomizationConfig(payload.productId),
      listRingCustomizationCatalog(),
      prisma.product.findUnique({
        where: { id: payload.productId },
        select: { id: true },
      }),
    ]);
    if (!product) return badRequest("محصول پیدا نشد.");
    const config = configResult.config;
    if (!config.enabled) return badRequest("شخصی‌سازی خرید برای این محصول فعال نیست.");
    const productPieceCode = resolvePieceCode({ id: product.id });

    const artisanPrice = (id?: string) => catalog.artisans.find((item) => item.id === id)?.priceAdd ?? 0;
    const patternPrice = (id?: string) => catalog.shankPatterns.find((item) => item.id === id)?.priceAdd ?? 0;
    const textPrice = (id?: string) => catalog.stoneTexts.find((item) => item.id === id)?.priceAdd ?? 0;
    const scriptPrice = (id?: string) => catalog.scriptStyles.find((item) => item.id === id)?.priceAdd ?? 0;

    const customization = calculateRingPurchaseCustomization(config, {
      productId: productPieceCode,
      size: payload.size?.selected != null ? { selected: Number(payload.size.selected) } : undefined,
      shank: payload.shank
        ? {
            state: payload.shank.state ?? "unchanged",
            artisanPriceAdd: artisanPrice(payload.shank.artisanId),
            patternPriceAdd: patternPrice(payload.shank.patternId),
          }
        : undefined,
      stone: payload.stone
        ? {
            state: payload.stone.state ?? "unchanged",
            artisanPriceAdd: artisanPrice(payload.stone.artisanId),
            textPriceAdd: textPrice(payload.stone.textId),
            scriptStylePriceAdd: scriptPrice(payload.stone.scriptStyleId),
          }
        : undefined,
    });

    return ok({ customization });
  } catch (error) {
    return handleRouteError(error, { route: "/api/ring-customization/price-preview" });
  }
}

