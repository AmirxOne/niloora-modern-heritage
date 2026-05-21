export const SHIPPING_METHODS = [
  {
    id: "standard",
    label: "پست پیشتاز",
    eta: "۳ تا ۷ روز کاری",
  },
  {
    id: "express_tehran",
    label: "پیک فوری (تهران)",
    eta: "۱ تا ۲ روز کاری",
    expressSurchargeHint: "+۱۰۰٬۰۰۰ تومان",
  },
] as const;

export type ShippingMethodId = (typeof SHIPPING_METHODS)[number]["id"];

const METHOD_BY_ID = new Map(SHIPPING_METHODS.map((m) => [m.id, m]));

export function isShippingMethodId(value: string): value is ShippingMethodId {
  return METHOD_BY_ID.has(value as ShippingMethodId);
}

export function getShippingMethod(id: string) {
  return METHOD_BY_ID.get(id as ShippingMethodId);
}

export function shippingMethodLabel(id: string | null | undefined): string {
  if (!id) return "—";
  return getShippingMethod(id)?.label ?? id;
}
