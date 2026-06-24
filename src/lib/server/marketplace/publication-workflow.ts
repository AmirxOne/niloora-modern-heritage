import type { ProductPublicationStatus } from "@/lib/types/marketplace";
import { isProductPublicationStatus } from "@/lib/types/marketplace";
import {
  assertPublicationTransition,
  canTransition,
  type ProductModerationAction,
} from "@/lib/server/marketplace/product-state-machine";

export type { ProductModerationAction };

export function canVendorEditProduct(status: ProductPublicationStatus): boolean {
  return status === "draft" || status === "rejected";
}

export function canVendorSubmitProduct(status: ProductPublicationStatus): boolean {
  return canTransition(status, "pending_review", "vendor");
}

export function assertVendorSubmitTransition(
  from: ProductPublicationStatus
): ProductPublicationStatus {
  return assertPublicationTransition(from, "pending_review", "vendor", "PRODUCT_SUBMIT_INVALID_STATE");
}

export function adminApproveTargetStatus(): ProductPublicationStatus {
  return "published";
}

export function adminRejectTargetStatus(): ProductPublicationStatus {
  return "rejected";
}

export function assertAdminModerationTransition(
  from: ProductPublicationStatus,
  to: ProductPublicationStatus
): ProductPublicationStatus {
  return assertPublicationTransition(from, to, "admin", "PRODUCT_MODERATION_INVALID_STATE");
}

export function parsePublicationStatus(value: string): ProductPublicationStatus | null {
  return isProductPublicationStatus(value) ? value : null;
}
