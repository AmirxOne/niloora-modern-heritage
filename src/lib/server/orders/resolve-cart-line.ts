import { calculateCustomizerPrice } from "@/lib/customizer-pricing";
import { DEFAULT_PRODUCT_IMAGE } from "@/lib/images";
import { getProductPricing } from "@/lib/pricing";
import { normalizePieceCode, resolvePieceCode } from "@/lib/products/piece-code";
import { calculateRingPurchaseCustomization } from "@/lib/ring-purchase-customization/pricing";
import { sanitizeCustomizer } from "@/lib/store/customizer-utils";
import { CartPurchaseError } from "@/lib/server/products/validate-cart-purchase";
import type { CartItem, CustomizerState, Product } from "@/lib/types";
import type { RingPurchaseCustomization } from "@/lib/types/ring-customization";

export type ResolvedCartLine = CartItem & { quantity: number };

export type DbProduct = {
  id: string;
  name: string;
  productType?: Product["productType"];
  pieceCode?: string | null;
  sku?: string | null;
  price: number;
  listPrice?: number | null;
  discountPercent?: number | null;
  image: string;
  availability: Product["availability"];
};

export type RingCustomizationConfigLookup = {
  productId: string;
  enabled: boolean;
  sizeBase: number | null;
  sizeMin: number | null;
  sizeMax: number | null;
  sizePricingMode: string;
  sizeFixedDelta: number;
  sizeStepAmount: number;
  shankEnabled: boolean;
  shankDefaultIncluded: boolean;
  shankDefaultRemovalCredit: number;
  stoneEnabled: boolean;
  stoneDefaultIncluded: boolean;
  stoneDefaultRemovalCredit: number;
  baseLeadTimeDays: number;
  sizeLeadTimeDays: number;
  shankLeadTimeDays: number;
  stoneLeadTimeDays: number;
  allowedShankArtisanIds: string[];
  allowedShankPatternIds: string[];
  allowedStoneArtisanIds: string[];
  allowedStoneTextIds: string[];
  allowedScriptStyleIds: string[];
};

type CatalogPriceLookup = {
  artisansById: Map<string, { id: string; active: boolean; scope: string; priceAdd: number }>;
  shankPatternsById: Map<string, { id: string; active: boolean; priceAdd: number }>;
  stoneTextsById: Map<string, { id: string; active: boolean; priceAdd: number }>;
  scriptStylesById: Map<string, { id: string; active: boolean; priceAdd: number }>;
};

export type ResolveLookup = {
  ringConfigByProductId: Map<string, RingCustomizationConfigLookup>;
  catalog: CatalogPriceLookup;
};

function applyRingCustomizationOnCatalogLine(
  item: CartItem,
  product: DbProduct,
  lookup?: ResolveLookup
): RingPurchaseCustomization | undefined {
  const incoming = item.ringPurchaseCustomization;
  if (!incoming) return undefined;
  if (!lookup) {
    throw new CartPurchaseError("تنظیمات شخصی‌سازی خرید در سرور بارگذاری نشد.", {
      code: "ring_customization_unavailable",
      productId: product.id,
    });
  }
  const config = lookup.ringConfigByProductId.get(product.id);
  if (!config || !config.enabled) {
    throw new CartPurchaseError("شخصی‌سازی برای این محصول فعال نیست.", {
      code: "ring_customization_disabled",
      productId: product.id,
    });
  }
  const expectedPieceCode = resolvePieceCode({
    id: product.id,
    productType: product.productType ?? "ring-men",
    pieceCode: product.pieceCode ?? null,
    sku: product.sku ?? null,
  });
  const incomingProductRef = normalizePieceCode(incoming.productId);
  const normalizedProductId = normalizePieceCode(product.id);
  if (incomingProductRef !== normalizePieceCode(expectedPieceCode) && incomingProductRef !== normalizedProductId) {
    throw new CartPurchaseError("پیکربندی شخصی‌سازی متعلق به این محصول نیست.", {
      code: "ring_customization_product_mismatch",
      productId: product.id,
    });
  }

  const pickArtisanPrice = (id?: string, scope?: "shank" | "stone") => {
    if (!id) return 0;
    const artisan = lookup.catalog.artisansById.get(id);
    if (!artisan || !artisan.active) {
      throw new CartPurchaseError("طراح انتخاب‌شده معتبر نیست.", {
        code: "ring_customization_invalid_artisan",
        productId: product.id,
      });
    }
    if (scope && artisan.scope !== "both" && artisan.scope !== scope) {
      throw new CartPurchaseError("طراح برای این شاخه مجاز نیست.", {
        code: "ring_customization_invalid_artisan_scope",
        productId: product.id,
      });
    }
    return artisan.priceAdd;
  };

  const pickPatternPrice = (id?: string) => {
    if (!id) return 0;
    const pattern = lookup.catalog.shankPatternsById.get(id);
    if (!pattern || !pattern.active) {
      throw new CartPurchaseError("مدل قلم‌کاری انتخاب‌شده معتبر نیست.", {
        code: "ring_customization_invalid_pattern",
        productId: product.id,
      });
    }
    return pattern.priceAdd;
  };

  const pickStoneTextPrice = (id?: string) => {
    if (!id) return 0;
    const text = lookup.catalog.stoneTextsById.get(id);
    if (!text || !text.active) {
      throw new CartPurchaseError("متن حک انتخاب‌شده معتبر نیست.", {
        code: "ring_customization_invalid_text",
        productId: product.id,
      });
    }
    return text.priceAdd;
  };

  const pickScriptPrice = (id?: string) => {
    if (!id) return 0;
    const style = lookup.catalog.scriptStylesById.get(id);
    if (!style || !style.active) {
      throw new CartPurchaseError("سبک خط انتخاب‌شده معتبر نیست.", {
        code: "ring_customization_invalid_script_style",
        productId: product.id,
      });
    }
    return style.priceAdd;
  };

  const ensureAllowed = (id: string | undefined, allowed: string[]) => {
    if (!id) return;
    if (allowed.length > 0 && !allowed.includes(id)) {
      throw new CartPurchaseError("گزینه انتخاب‌شده برای این محصول مجاز نیست.", {
        code: "ring_customization_not_allowed",
        productId: product.id,
      });
    }
  };

  ensureAllowed(incoming.shank?.artisanId, config.allowedShankArtisanIds);
  ensureAllowed(incoming.shank?.patternId, config.allowedShankPatternIds);
  ensureAllowed(incoming.stone?.artisanId, config.allowedStoneArtisanIds);
  ensureAllowed(incoming.stone?.textId, config.allowedStoneTextIds);
  ensureAllowed(incoming.stone?.scriptStyleId, config.allowedScriptStyleIds);

  const calculated = calculateRingPurchaseCustomization(
    {
      id: incoming.productId,
      productId: config.productId,
      enabled: config.enabled,
      sizeBase: config.sizeBase,
      sizeMin: config.sizeMin,
      sizeMax: config.sizeMax,
      sizePricingMode:
        config.sizePricingMode === "fixed" || config.sizePricingMode === "step"
          ? config.sizePricingMode
          : "free",
      sizeFixedDelta: config.sizeFixedDelta,
      sizeStepAmount: config.sizeStepAmount,
      shankEnabled: config.shankEnabled,
      shankDefaultIncluded: config.shankDefaultIncluded,
      shankDefaultRemovalCredit: config.shankDefaultRemovalCredit,
      stoneEnabled: config.stoneEnabled,
      stoneDefaultIncluded: config.stoneDefaultIncluded,
      stoneDefaultRemovalCredit: config.stoneDefaultRemovalCredit,
      baseLeadTimeDays: config.baseLeadTimeDays,
      sizeLeadTimeDays: config.sizeLeadTimeDays,
      shankLeadTimeDays: config.shankLeadTimeDays,
      stoneLeadTimeDays: config.stoneLeadTimeDays,
    },
    {
      productId: expectedPieceCode,
      size: incoming.size ? { selected: incoming.size.selected } : undefined,
      shank: incoming.shank
        ? {
            state: incoming.shank.state,
            artisanId: incoming.shank.artisanId,
            patternId: incoming.shank.patternId,
            artisanPriceAdd: pickArtisanPrice(incoming.shank.artisanId, "shank"),
            patternPriceAdd: pickPatternPrice(incoming.shank.patternId),
          }
        : undefined,
      stone: incoming.stone
        ? {
            state: incoming.stone.state,
            artisanId: incoming.stone.artisanId,
            textId: incoming.stone.textId,
            scriptStyleId: incoming.stone.scriptStyleId,
            artisanPriceAdd: pickArtisanPrice(incoming.stone.artisanId, "stone"),
            textPriceAdd: pickStoneTextPrice(incoming.stone.textId),
            scriptStylePriceAdd: pickScriptPrice(incoming.stone.scriptStyleId),
          }
        : undefined,
    }
  );

  if (calculated.totalCustomizationDelta !== incoming.totalCustomizationDelta) {
    throw new CartPurchaseError("قیمت شخصی‌سازی معتبر نیست و نیاز به بروزرسانی دارد.", {
      code: "ring_customization_price_mismatch",
      productId: product.id,
    });
  }

  return calculated;
}

/** Catalog line — prices always from DB, never from client payload. */
export function resolveCatalogCartLine(
  item: CartItem,
  product: DbProduct,
  lookup?: ResolveLookup
): ResolvedCartLine {
  const pricing = getProductPricing({
    price: product.price,
    listPrice: product.listPrice ?? undefined,
    discountPercent: product.discountPercent ?? undefined,
  });
  const ringPurchaseCustomization = applyRingCustomizationOnCatalogLine(item, product, lookup);
  const delta = ringPurchaseCustomization?.totalCustomizationDelta ?? 0;
  const unitPrice = Math.max(0, pricing.salePrice + delta);
  const unitList = Math.max(unitPrice, (pricing.listPrice ?? pricing.salePrice) + delta);

  return {
    id: item.id,
    productId: product.id,
    name: product.name,
    image: product.image,
    availability: product.availability,
    quantity: item.quantity,
    price: unitPrice,
    listPrice: unitList,
    customizerState: undefined,
    ringPurchaseCustomization,
  };
}

/** Custom atelier line — price from server-side calculator only. */
export function resolveCustomDesignCartLine(item: CartItem): ResolvedCartLine {
  if (!item.customizerState) {
    throw new CartPurchaseError("پیکربندی سفارشی معتبر نیست.", { code: "invalid_custom" });
  }

  const { state } = sanitizeCustomizer(item.customizerState as CustomizerState);
  const unitPrice = calculateCustomizerPrice(state);

  return {
    id: item.id,
    name: item.name?.trim() || "انگشتر سفارشی",
    image: item.image || DEFAULT_PRODUCT_IMAGE,
    quantity: item.quantity,
    price: unitPrice,
    listPrice: unitPrice,
    customizerState: state,
    productId: undefined,
  };
}

export function resolveCartLine(
  item: CartItem,
  productsById: Map<string, DbProduct>,
  lookup?: ResolveLookup
): ResolvedCartLine {
  if (item.quantity < 1) {
    throw new CartPurchaseError("تعداد نامعتبر در سبد.", { code: "invalid_quantity" });
  }

  if (item.customizerState) {
    return resolveCustomDesignCartLine(item);
  }

  if (item.productId) {
    const product = productsById.get(item.productId);
    if (!product) {
      throw new CartPurchaseError("برخی اقلام سبد در گالری موجود نیستند.", {
        productId: item.productId,
        code: "not_found",
      });
    }
    return resolveCatalogCartLine(item, product, lookup);
  }

  throw new CartPurchaseError("قلم سبد باید محصول گالری یا طرح سفارشی باشد.", {
    code: "invalid_line",
  });
}
