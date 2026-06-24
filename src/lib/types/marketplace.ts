/** Product curation lifecycle (marketplace). Phase 1: stored only; not used for visibility yet. */
import type { VendorStatus } from "@/lib/types/vendor";

export type ProductPublicationStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "published"
  | "rejected"
  | "archived";

export const PRODUCT_PUBLICATION_STATUS_VALUES: readonly ProductPublicationStatus[] = [
  "draft",
  "pending_review",
  "approved",
  "published",
  "rejected",
  "archived",
] as const;

export function isProductPublicationStatus(value: string): value is ProductPublicationStatus {
  return (PRODUCT_PUBLICATION_STATUS_VALUES as readonly string[]).includes(value);
}

export interface ProductVendorSummary {
  id: string;
  slug: string;
  displayName: string;
  displayNameFa?: string;
  status: VendorStatus;
  /** Computed 0–100; shown in UI when above badge threshold. */
  trustScore?: number;
}
