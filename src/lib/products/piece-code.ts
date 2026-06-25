/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * شناسهٔ اثر (Piece Code)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 *   NL-RGM-0042
 *   │   │    │
 *   │   │    └─ شمارهٔ سریال ۴ رقمی (یکتا داخل هر نوع اثر)
 *   │   └────── کد ۳-حرفی نوع اثر (انگشتر/گردنبند/تسبیح/...)
 *   └────────── پیشوند برند نیلورا
 *
 * اهداف:
 *  1) هر اثر کد یکتا و خوانا داشته باشد که مشتری راحت در تماس یا پیام
 *     بگوید و کسب‌وکار بلافاصله بفهمد دقیقا چه اثری مدنظر است.
 *  2) قابل گسترش به دسته‌های آینده (تسبیح، گردنبند زنانه، …) باشد.
 *  3) برای محصولاتی که شناسهٔ صریح ندارند، کد به‌صورت قطعی و پایدار از
 *     `id` تولید شود (نه تصادفی) تا با هر بار بارگذاری یکسان باشد.
 *  4) از کد به محصول و از محصول به کد دو-طرفه قابل ترجمه باشد.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

import type { Product, ProductType } from "@/lib/types";

/** پیشوند برند — در آینده در صورت ریبرند تنها این مقدار عوض می‌شود. */
export const BRAND_PIECE_PREFIX = "NL";

/** تعداد ارقام شمارهٔ سریال — ۴ رقم پاسخگوی تا ۱۰٬۰۰۰ اثر در هر دسته است. */
export const PIECE_SEQUENCE_LENGTH = 4;

/**
 * نگاشت نوع اثر → اطلاعات شناسه.
 * `code` همیشه ۳ حرف بزرگ لاتین است و *هرگز* عوض نمی‌شود
 * (در غیر این صورت کدهای قبلی نامعتبر می‌شوند).
 */
export const PRODUCT_TYPE_CODES: Record<
  ProductType,
  { code: string; faLabel: string; enLabel: string }
> = {
  "ring-men":   { code: "RGM", faLabel: "انگشتر مردانه",   enLabel: "Ring (Men)" },
  "ring-women": { code: "RGW", faLabel: "انگشتر زنانه",     enLabel: "Ring (Women)" },
  necklace:     { code: "NCK", faLabel: "گردنبند",          enLabel: "Necklace" },
  pendant:      { code: "PND", faLabel: "آویز",             enLabel: "Pendant" },
  bracelet:     { code: "BRC", faLabel: "دستبند",           enLabel: "Bracelet" },
  bangle:       { code: "BNG", faLabel: "النگو",            enLabel: "Bangle" },
  earring:      { code: "ERR", faLabel: "گوشواره",          enLabel: "Earring" },
  tasbih:       { code: "TSB", faLabel: "تسبیح",            enLabel: "Tasbih" },
  cufflink:     { code: "CFL", faLabel: "دکمه سرآستین",     enLabel: "Cufflink" },
  brooch:       { code: "BRH", faLabel: "گل سینه",          enLabel: "Brooch" },
  other:        { code: "OTH", faLabel: "سایر آثار",        enLabel: "Other" },
};

/** پیش‌فرض نوع اثر برای محصولاتی که `productType` ندارند. */
export const DEFAULT_PRODUCT_TYPE: ProductType = "ring-men";

/* -------------------------------------------------------------------------- */
/*  Hash deterministic ۴-رقمی از شناسهٔ محصول                                  */
/* -------------------------------------------------------------------------- */

/**
 * FNV-1a 32-bit — هش سبک و توزیع‌شدهٔ مناسب برای کاربردهای غیر-رمزنگاری.
 * خروجی همیشه برای ورودی یکسان، یکسان است (deterministic).
 */
function fnv1aHash(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  // تبدیل به عدد مثبت
  return hash >>> 0;
}

/** نگاشت یک رشته به عددی ۴-رقمی در بازهٔ [1, 9999]. */
function deterministicSequence(input: string): number {
  const raw = fnv1aHash(input);
  // از ۱ شروع می‌کنیم تا «0000» تولید نشود (برای رزرو ادمین)
  return (raw % 9999) + 1;
}

/** تبدیل عدد سریال به رشتهٔ ۴-رقمی پدشدهٔ صفر. */
function padSequence(n: number): string {
  return n.toString().padStart(PIECE_SEQUENCE_LENGTH, "0").slice(-PIECE_SEQUENCE_LENGTH);
}

/* -------------------------------------------------------------------------- */
/*  ساخت / استخراج کد                                                          */
/* -------------------------------------------------------------------------- */

export interface PieceCodeParts {
  /** پیشوند برند (مثل «NL») */
  brand: string;
  /** کد ۳-حرفی نوع اثر (مثل «RGM») */
  typeCode: string;
  /** نوع اثر مرتبط (در صورت معتبر بودن کد) */
  productType: ProductType | null;
  /** عدد سریال ۴-رقمی به‌صورت رشته (مثل «0042») */
  sequence: string;
}

/**
 * تشخیص نوع اثر از کد ۳-حرفی (مثلاً «RGM» → "ring-men").
 * اگر کد نامعتبر باشد، `null` بازمی‌گرداند.
 */
export function productTypeFromCode(code: string): ProductType | null {
  const normalized = code.toUpperCase();
  const entry = Object.entries(PRODUCT_TYPE_CODES).find(
    ([, v]) => v.code === normalized
  );
  return entry ? (entry[0] as ProductType) : null;
}

/**
 * شناسهٔ اثر یک محصول را برمی‌گرداند.
 *  - اگر `product.pieceCode` به‌طور صریح تنظیم شده باشد، همان استفاده می‌شود.
 *  - در غیر این صورت با هش قطعی از `id` تولید می‌شود.
 *
 * این تابع *هرگز* تصادف نمی‌کند و برای یک محصول ثابت همیشه یک کد ثابت می‌دهد.
 */
export function resolvePieceCode(
  product: Pick<Product, "id" | "productType" | "pieceCode" | "sku">
): string {
  if (product.pieceCode && isValidPieceCode(product.pieceCode)) {
    return normalizePieceCode(product.pieceCode);
  }
  // پشتیبانی عقب‌رو از فیلد قدیمی `sku`
  if (product.sku && isValidPieceCode(product.sku)) {
    return normalizePieceCode(product.sku);
  }
  // شناسهٔ دیتابیس اغلب همان کد اثر است (مثل NL-RGM-2900).
  if (isValidPieceCode(product.id)) {
    return normalizePieceCode(product.id);
  }

  const productType = product.productType ?? DEFAULT_PRODUCT_TYPE;
  const typeMeta = PRODUCT_TYPE_CODES[productType];
  const seq = padSequence(deterministicSequence(`${typeMeta.code}-${product.id}`));
  return `${BRAND_PIECE_PREFIX}-${typeMeta.code}-${seq}`;
}

/** تجزیهٔ یک کد به اجزای آن. اگر فرمت نامعتبر باشد `null`. */
export function parsePieceCode(input: string): PieceCodeParts | null {
  if (!input) return null;
  const normalized = normalizePieceCode(input);
  // فرمت دقیق: BRAND-TYPE-SEQ (همه با خط تیره، حروف بزرگ، اعداد لاتین)
  const match = /^([A-Z]{2})-([A-Z]{3})-(\d{4})$/.exec(normalized);
  if (!match) return null;
  const [, brand, typeCode, sequence] = match;
  return {
    brand,
    typeCode,
    productType: productTypeFromCode(typeCode),
    sequence,
  };
}

export function isValidPieceCode(input: string): boolean {
  return parsePieceCode(input) !== null;
}

/**
 * نرمال‌سازی ورودی کاربر:
 *  - حذف فاصله و حروف کنترلی
 *  - تبدیل اعداد فارسی/عربی به لاتین
 *  - بزرگ‌کردن حروف لاتین
 *  - پذیرش جداکننده‌های مختلف (- _ . /) و یکدست‌سازی به «-»
 */
export function normalizePieceCode(input: string): string {
  if (!input) return "";
  let s = input.trim();

  // ارقام فارسی / عربی → لاتین
  s = s.replace(/[\u06F0-\u06F9]/g, (d) =>
    String.fromCharCode(d.charCodeAt(0) - 0x06f0 + 48)
  );
  s = s.replace(/[\u0660-\u0669]/g, (d) =>
    String.fromCharCode(d.charCodeAt(0) - 0x0660 + 48)
  );

  s = s
    .toUpperCase()
    .replace(/[\s_\.\/]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/[^A-Z0-9-]/g, "");

  return s;
}

/* -------------------------------------------------------------------------- */
/*  جستجو / بازنمایی                                                            */
/* -------------------------------------------------------------------------- */

/**
 * پیدا کردن محصول از روی کد اعلامی مشتری.
 * - نسبت به فرمت ورودی متسامح است (با/بدون خط‌تیره، اعداد فارسی، فاصله…).
 * - اگر شناسهٔ صریح ذخیره شده با محاسبه‌شده مطابقت نداشت، باز هم پیدا می‌شود.
 */
export function findProductByPieceCode<
  T extends Pick<Product, "id" | "productType" | "pieceCode" | "sku">
>(products: readonly T[], code: string): T | null {
  const needle = normalizePieceCode(code);
  if (!isValidPieceCode(needle)) return null;
  return (
    products.find((p) => resolvePieceCode(p) === needle) ??
    products.find(
      (p) => (p.pieceCode && normalizePieceCode(p.pieceCode) === needle) ||
             (p.sku && normalizePieceCode(p.sku) === needle)
    ) ??
    null
  );
}

/**
 * نسخهٔ خوانا برای نمایش (مثلا در کارت یا روی فاکتور).
 * در حال حاضر همان کد است — اگر خواستیم بعدا فرمت چاپی متفاوت شود
 * تنها این تابع تغییر می‌کند.
 */
export function formatPieceCode(code: string): string {
  return normalizePieceCode(code);
}

/** برچسب فارسی نوع اثر از روی کد کامل. */
export function pieceCodeTypeLabelFa(code: string): string | null {
  const parts = parsePieceCode(code);
  if (!parts || !parts.productType) return null;
  return PRODUCT_TYPE_CODES[parts.productType].faLabel;
}

/** تبدیل ارقام لاتین به فارسی برای نمایش شمارهٔ سریال در UI فارسی. */
export function pieceCodeToFarsiDigits(code: string): string {
  const normalized = formatPieceCode(code);
  return normalized.replace(/\d/g, (d) =>
    String.fromCharCode(0x06f0 + d.charCodeAt(0) - 48)
  );
}
