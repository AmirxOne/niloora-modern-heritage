import { fa } from "@/lib/i18n/fa";
import type { ProductAvailability } from "@/lib/types";

export const PRODUCT_AVAILABILITY_OPTIONS: ProductAvailability[] = [
  "ready",
  "preorder",
  "sold",
  "luxury",
  "made-to-order",
];

export type ProductStatusTone = "ready" | "wait" | "sold" | "luxury" | "custom";

export interface ProductStatusConfig {
  label: string;
  shortLabel: string;
  description: string;
  deliveryHint: string;
  tone: ProductStatusTone;
  canAddToCart: boolean;
  addToCartLabel: string;
  isImmediate: boolean;
}

const configs: Record<ProductAvailability, ProductStatusConfig> = {
  ready: {
    label: fa.productStatus.ready.label,
    shortLabel: fa.productStatus.ready.short,
    description: fa.productStatus.ready.description,
    deliveryHint: fa.productStatus.ready.delivery,
    tone: "ready",
    canAddToCart: true,
    addToCartLabel: fa.productStatus.ready.addToCart,
    isImmediate: true,
  },
  preorder: {
    label: fa.productStatus.preorder.label,
    shortLabel: fa.productStatus.preorder.short,
    description: fa.productStatus.preorder.description,
    deliveryHint: fa.productStatus.preorder.delivery,
    tone: "wait",
    canAddToCart: true,
    addToCartLabel: fa.productStatus.preorder.addToCart,
    isImmediate: false,
  },
  sold: {
    label: fa.productStatus.sold.label,
    shortLabel: fa.productStatus.sold.short,
    description: fa.productStatus.sold.description,
    deliveryHint: fa.productStatus.sold.delivery,
    tone: "sold",
    canAddToCart: false,
    addToCartLabel: fa.productStatus.sold.addToCart,
    isImmediate: false,
  },
  luxury: {
    label: fa.productStatus.luxury.label,
    shortLabel: fa.productStatus.luxury.short,
    description: fa.productStatus.luxury.description,
    deliveryHint: fa.productStatus.luxury.delivery,
    tone: "luxury",
    canAddToCart: true,
    addToCartLabel: fa.productStatus.luxury.addToCart,
    isImmediate: false,
  },
  "made-to-order": {
    label: fa.productStatus.madeToOrder.label,
    shortLabel: fa.productStatus.madeToOrder.short,
    description: fa.productStatus.madeToOrder.description,
    deliveryHint: fa.productStatus.madeToOrder.delivery,
    tone: "custom",
    canAddToCart: true,
    addToCartLabel: fa.productStatus.madeToOrder.addToCart,
    isImmediate: false,
  },
};

export function getProductStatusConfig(
  availability: ProductAvailability = "ready"
): ProductStatusConfig {
  return configs[availability];
}

export function isImmediateDelivery(availability: ProductAvailability): boolean {
  return getProductStatusConfig(availability).isImmediate;
}
