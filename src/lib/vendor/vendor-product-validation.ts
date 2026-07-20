import { PRODUCT_AVAILABILITY_OPTIONS } from "@/lib/product-status";
import {
  VENDOR_PRODUCT_CATEGORIES,
  VENDOR_PRODUCT_METALS,
  VENDOR_PRODUCT_STONES,
} from "@/lib/vendor/product-form-options";
import type { ProductAvailability } from "@/lib/types";
import type { VendorProductInput } from "@/lib/server/marketplace/vendor-product-service";

export const VENDOR_PRODUCT_PRICE_MIN = 1;
export const VENDOR_PRODUCT_PRICE_MAX = 1_000_000_000;
export const VENDOR_PRODUCT_STOCK_MIN = 0;
export const VENDOR_PRODUCT_STOCK_MAX = 100_000;
export const VENDOR_PRODUCT_NAME_MAX = 120;
export const VENDOR_PRODUCT_NAME_FA_MAX = 120;
export const VENDOR_PRODUCT_HEADLINE_MAX = 160;

type ValidationMode = "create" | "update";

type ValidationResult =
  | { ok: true; data: Partial<VendorProductInput> }
  | { ok: false; message: string };

function toTrimmedString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  return value.trim();
}

function isSafeImageUrl(value: string): boolean {
  return (
    value.startsWith("/uploads/") ||
    value.startsWith("http://") ||
    value.startsWith("https://")
  );
}

function parseInteger(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Number.isInteger(value) ? value : null;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) && Number.isInteger(parsed) ? parsed : null;
  }
  return null;
}

export function validateVendorProductInput(
  raw: Partial<VendorProductInput>,
  mode: ValidationMode
): ValidationResult {
  const out: Partial<VendorProductInput> = {};
  const has = (key: keyof VendorProductInput) => raw[key] !== undefined;

  const requireOnCreate = (condition: boolean, message: string) => {
    if (mode === "create" && !condition) return { ok: false as const, message };
    return null;
  };

  const name = toTrimmedString(raw.name);
  if (has("name")) {
    if (!name) return { ok: false, message: "نام محصول الزامی است." };
    if (name.length > VENDOR_PRODUCT_NAME_MAX) {
      return { ok: false, message: "نام محصول بیش از حد طولانی است." };
    }
    out.name = name;
  }
  const nameRequiredError = requireOnCreate(Boolean(name), "نام محصول الزامی است.");
  if (nameRequiredError) return nameRequiredError;

  const namePersian = toTrimmedString(raw.namePersian);
  if (has("namePersian")) {
    if (!namePersian) return { ok: false, message: "نام فارسی محصول الزامی است." };
    if (namePersian.length > VENDOR_PRODUCT_NAME_FA_MAX) {
      return { ok: false, message: "نام فارسی محصول بیش از حد طولانی است." };
    }
    out.namePersian = namePersian;
  }
  const nameFaRequiredError = requireOnCreate(Boolean(namePersian), "نام فارسی محصول الزامی است.");
  if (nameFaRequiredError) return nameFaRequiredError;

  const image = toTrimmedString(raw.image);
  if (has("image")) {
    if (!image) return { ok: false, message: "تصویر محصول الزامی است." };
    if (!isSafeImageUrl(image)) {
      return { ok: false, message: "آدرس تصویر نامعتبر است." };
    }
    out.image = image;
  }
  const imageRequiredError = requireOnCreate(Boolean(image), "تصویر محصول الزامی است.");
  if (imageRequiredError) return imageRequiredError;

  const price = parseInteger(raw.price);
  if (has("price")) {
    if (price == null) return { ok: false, message: "قیمت محصول باید عدد صحیح باشد." };
    if (price < VENDOR_PRODUCT_PRICE_MIN || price > VENDOR_PRODUCT_PRICE_MAX) {
      return {
        ok: false,
        message: `قیمت محصول باید بین ${VENDOR_PRODUCT_PRICE_MIN} تا ${VENDOR_PRODUCT_PRICE_MAX} باشد.`,
      };
    }
    out.price = price;
  }
  const priceRequiredError = requireOnCreate(price != null, "قیمت محصول الزامی است.");
  if (priceRequiredError) return priceRequiredError;

  const stock = parseInteger(raw.stock);
  if (has("stock")) {
    if (stock == null) return { ok: false, message: "موجودی محصول باید عدد صحیح باشد." };
    if (stock < VENDOR_PRODUCT_STOCK_MIN || stock > VENDOR_PRODUCT_STOCK_MAX) {
      return {
        ok: false,
        message: `موجودی محصول باید بین ${VENDOR_PRODUCT_STOCK_MIN} تا ${VENDOR_PRODUCT_STOCK_MAX} باشد.`,
      };
    }
    out.stock = stock;
  } else if (mode === "create") {
    out.stock = 1;
  }

  if (has("category")) {
    const category = toTrimmedString(raw.category);
    if (!category || !VENDOR_PRODUCT_CATEGORIES.includes(category as (typeof VENDOR_PRODUCT_CATEGORIES)[number])) {
      return { ok: false, message: "دسته‌بندی محصول نامعتبر است." };
    }
    out.category = category;
  }

  if (has("metal")) {
    const metal = toTrimmedString(raw.metal);
    if (!metal || !VENDOR_PRODUCT_METALS.includes(metal as (typeof VENDOR_PRODUCT_METALS)[number])) {
      return { ok: false, message: "نوع فلز محصول نامعتبر است." };
    }
    out.metal = metal;
  }

  if (has("stone")) {
    const stone = toTrimmedString(raw.stone);
    if (!stone || !VENDOR_PRODUCT_STONES.includes(stone as (typeof VENDOR_PRODUCT_STONES)[number])) {
      return { ok: false, message: "نوع سنگ محصول نامعتبر است." };
    }
    out.stone = stone;
  }

  if (has("availability")) {
    const availability = toTrimmedString(raw.availability) as ProductAvailability | undefined;
    if (!availability || !PRODUCT_AVAILABILITY_OPTIONS.includes(availability)) {
      return { ok: false, message: "وضعیت موجودی محصول نامعتبر است." };
    }
    out.availability = availability;
  }

  if (has("listingHeadline")) {
    const headline = toTrimmedString(raw.listingHeadline);
    if (!headline) return { ok: false, message: "تیتر محصول نمی‌تواند خالی باشد." };
    if (headline.length > VENDOR_PRODUCT_HEADLINE_MAX) {
      return { ok: false, message: "تیتر محصول بیش از حد طولانی است." };
    }
    out.listingHeadline = headline;
  }

  if (mode === "update" && Object.keys(out).length === 0) {
    return { ok: false, message: "حداقل یک فیلد معتبر برای ویرایش ارسال کنید." };
  }

  return { ok: true, data: out };
}
