import type { PreOwnedGrade, Product, ProductCondition } from "@/lib/types";
import { fa } from "@/lib/i18n/fa";

export function getProductCondition(product: Product): ProductCondition {
  return product.condition ?? "new";
}

export function isPreOwnedProduct(product: Product): boolean {
  return getProductCondition(product) === "pre-owned";
}

export function getPreOwnedGradeLabel(grade: PreOwnedGrade): string {
  return fa.preOwned.grades[grade];
}

export function estimateBuybackPrice(product: Product): number | null {
  if (!isPreOwnedProduct(product) || !product.preOwned) return null;
  return Math.round((product.price * product.preOwned.buybackRatePercent) / 100);
}

export function getPreOwnedSavingsPercent(product: Product): number | null {
  if (!product.preOwned) return null;
  return product.preOwned.depreciationPercent;
}
