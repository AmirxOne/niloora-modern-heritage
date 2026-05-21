/** تخفیف سراسری گالری — روی جمع پس از بهاکاهی هر اثر */
export const SITE_WIDE_DISCOUNT = {
  enabled: true,
  percent: 20,
  title: "جشنواره بهاکاهی گالری",
  description: "۲۰٪ بهاکاهی اضافه بر قیمت نهایی همهٔ آثار",
};

/**
 * تایمر پایان تخفیف
 * - defaultEndsAt: برای همه محصولات (اگر محصول تاریخ اختصاصی نداشته باشد)
 * - perProductEndsAt: برای محصول خاص
 */
export const DISCOUNT_COUNTDOWN = {
  enabled: true,
  defaultEndsAt: "2026-06-10T23:59:59+03:30",
  perProductEndsAt: {} as Record<string, string>,
};
