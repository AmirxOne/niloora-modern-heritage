import type { ShippingMethodId } from "@/lib/orders/shipping-methods";

/** بازه‌های ثابت هزینه ارسال (تومان) */
export type ShippingZoneId = "tehran" | "near" | "national";

export const SHIPPING_ZONE_LABELS: Record<ShippingZoneId, string> = {
  tehran: "تهران و البرز",
  near: "استان‌های مجاور و مراکز اصلی",
  national: "سایر استان‌ها",
};

const ZONE_BASE_TOMAN: Record<ShippingZoneId, number> = {
  tehran: 45_000,
  near: 75_000,
  national: 110_000,
};

/** اضافه‌بهای پیک فوری (روی بازهٔ منطقه) */
const EXPRESS_SURCHARGE_TOMAN = 100_000;

const TEHRAN_ZONE_PROVINCES = new Set(["تهران", "البرز"]);

/** استان‌های با فاصله متوسط از کارگاه (بازهٔ میانی) */
const NEAR_ZONE_PROVINCES = new Set([
  "اصفهان",
  "فارس",
  "خراسان رضوی",
  "قم",
  "قزوین",
  "مازندران",
  "گیلان",
  "گلستان",
  "خوزستان",
  "یزد",
  "کرمان",
  "همدان",
  "مرکزی",
  "زنجان",
]);

export type ShippingCostQuote = {
  ready: boolean;
  cost: number;
  zone: ShippingZoneId | null;
  zoneLabel: string | null;
  baseCost: number;
  methodSurcharge: number;
};

function normalizeProvince(province: string): string {
  return province.trim().replace(/\s+/g, " ");
}

export function resolveShippingZone(province: string): ShippingZoneId | null {
  const p = normalizeProvince(province);
  if (p.length < 2) return null;
  if (TEHRAN_ZONE_PROVINCES.has(p)) return "tehran";
  if (NEAR_ZONE_PROVINCES.has(p)) return "near";
  return "national";
}

export function computeShippingCost(input: {
  province: string;
  city?: string;
  shippingMethod: ShippingMethodId;
}): ShippingCostQuote {
  const zone = resolveShippingZone(input.province);
  if (!zone) {
    return {
      ready: false,
      cost: 0,
      zone: null,
      zoneLabel: null,
      baseCost: 0,
      methodSurcharge: 0,
    };
  }

  const baseCost = ZONE_BASE_TOMAN[zone];
  const methodSurcharge =
    input.shippingMethod === "express_tehran" ? EXPRESS_SURCHARGE_TOMAN : 0;

  return {
    ready: true,
    cost: baseCost + methodSurcharge,
    zone,
    zoneLabel: SHIPPING_ZONE_LABELS[zone],
    baseCost,
    methodSurcharge,
  };
}
