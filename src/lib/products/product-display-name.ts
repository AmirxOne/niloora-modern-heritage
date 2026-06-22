import { PRODUCT_TYPE_CODES, resolvePieceCode } from "@/lib/products/piece-code";
import type { Product } from "@/lib/types";

const TYPE_LABELS = Object.values(PRODUCT_TYPE_CODES)
  .map((entry) => entry.faLabel)
  .sort((a, b) => b.length - a.length);

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** حذف پیشوند نوع اثر از عنوان — مثلاً «انگشتر مردانه - عقیق یمن» → «عقیق یمن» */
export function stripProductTypePrefix(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return trimmed;

  for (const label of TYPE_LABELS) {
    const pattern = new RegExp(`^${escapeRegExp(label)}\\s*[-–—]\\s*`, "u");
    if (pattern.test(trimmed)) {
      return trimmed.replace(pattern, "").trim();
    }
  }

  return trimmed;
}

type ProductNameSource = Pick<Product, "id" | "name" | "namePersian" | "productType" | "pieceCode" | "sku">;

export function getProductRawName(product: ProductNameSource): string {
  return product.namePersian?.trim() || product.name?.trim() || "";
}

/** عنوان کوتاه برای کارت، جستجو، سبد و … — بدون پیشوند نوع اثر */
export function getProductDisplayName(
  product: ProductNameSource,
  options?: { stripTypePrefix?: boolean }
): string {
  const raw = getProductRawName(product);
  if (!raw) return "";

  if (/^[a-z0-9-]+$/i.test(raw)) {
    const code = resolvePieceCode(product);
    return code ? `اثر ${code}` : raw;
  }

  const strip = options?.stripTypePrefix !== false;
  return strip ? stripProductTypePrefix(raw) : raw;
}

/** برای نام‌های ذخیره‌شده (سبد، سفارش) که فقط رشته دارند */
export function getDisplayNameFromString(name: string, productId?: string): string {
  const raw = name.trim();
  if (!raw) return raw;

  if (/^[a-z0-9-]+$/i.test(raw) && productId) {
    const code = resolvePieceCode({ id: productId });
    return code ? `اثر ${code}` : raw;
  }

  return stripProductTypePrefix(raw);
}
