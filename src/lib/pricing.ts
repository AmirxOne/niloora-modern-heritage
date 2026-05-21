import { SITE_WIDE_DISCOUNT } from "@/lib/discounts-config";
import type { CartItem, Product, PromoCodeDefinition } from "@/lib/types";

export type SiteWideDiscountInput = {
  enabled: boolean;
  percent: number;
};
import { calcPromoDiscountAmount } from "@/lib/promo-utils";

export {
  defaultCustomizerState,
  calculateCustomizerPrice,
} from "@/lib/customizer-pricing";

export interface ProductPricing {
  listPrice: number;
  salePrice: number;
  productFurooh: number;
  furoohPercent: number;
  hasProductFurooh: boolean;
}

export interface CartLinePricing {
  itemId: string;
  quantity: number;
  unitListPrice: number;
  unitSalePrice: number;
  lineListTotal: number;
  lineSaleTotal: number;
  lineProductFurooh: number;
}

export interface CartPricingBreakdown {
  lines: CartLinePricing[];
  subtotalList: number;
  subtotalSale: number;
  productFurooh: number;
  siteWideFurooh: number;
  promoFurooh: number;
  checkoutFurooh: number;
  totalFurooh: number;
  payable: number;
  siteWideActive: boolean;
  siteWidePercent: number;
  appliedPromo: PromoCodeDefinition | null;
  promoCodeInput: string | null;
}

export function getProductPricing(product: Pick<Product, "price" | "listPrice" | "discountPercent">): ProductPricing {
  const listPrice = product.listPrice ?? product.price;
  let salePrice = product.price;

  if (product.discountPercent != null && product.discountPercent > 0) {
    salePrice = Math.round(listPrice * (1 - product.discountPercent / 100));
  }

  salePrice = Math.min(salePrice, listPrice);
  const productFurooh = Math.max(0, listPrice - salePrice);
  const furoohPercent = listPrice > 0 ? Math.round((productFurooh / listPrice) * 100) : 0;

  return {
    listPrice,
    salePrice,
    productFurooh,
    furoohPercent,
    hasProductFurooh: productFurooh > 0,
  };
}

export function calculateCartPricing(
  items: CartItem[],
  appliedPromo: PromoCodeDefinition | null,
  appliedPromoCode: string | null,
  siteWide: SiteWideDiscountInput = SITE_WIDE_DISCOUNT
): CartPricingBreakdown {
  const lines: CartLinePricing[] = items.map((item) => {
    const unitListPrice = item.listPrice ?? item.price;
    const unitSalePrice = item.price;
    const quantity = item.quantity;
    return {
      itemId: item.id,
      quantity,
      unitListPrice,
      unitSalePrice,
      lineListTotal: unitListPrice * quantity,
      lineSaleTotal: unitSalePrice * quantity,
      lineProductFurooh: Math.max(0, (unitListPrice - unitSalePrice) * quantity),
    };
  });

  const subtotalList = lines.reduce((s, l) => s + l.lineListTotal, 0);
  const subtotalSale = lines.reduce((s, l) => s + l.lineSaleTotal, 0);
  const productFurooh = lines.reduce((s, l) => s + l.lineProductFurooh, 0);

  const promoValid =
    appliedPromo && subtotalSale >= appliedPromo.minSubtotal ? appliedPromo : null;

  let siteWideFurooh = 0;
  let promoFurooh = 0;

  if (promoValid) {
    promoFurooh = calcPromoDiscountAmount(subtotalSale, promoValid);
    if (!promoValid.replacesSiteWide && siteWide.enabled) {
      siteWideFurooh = Math.round((subtotalSale - promoFurooh) * (siteWide.percent / 100));
    }
  } else if (siteWide.enabled && siteWide.percent > 0) {
    siteWideFurooh = Math.round(subtotalSale * (siteWide.percent / 100));
  }

  const checkoutFurooh = siteWideFurooh + promoFurooh;
  const totalFurooh = productFurooh + checkoutFurooh;
  const payable = Math.max(0, subtotalSale - checkoutFurooh);

  return {
    lines,
    subtotalList,
    subtotalSale,
    productFurooh,
    siteWideFurooh,
    promoFurooh,
    checkoutFurooh,
    totalFurooh,
    payable,
    siteWideActive: siteWide.enabled && !promoValid?.replacesSiteWide,
    siteWidePercent: siteWide.percent,
    appliedPromo: promoValid,
    promoCodeInput: appliedPromoCode,
  };
}
