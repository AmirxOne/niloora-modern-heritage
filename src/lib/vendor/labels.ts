import { fa } from "@/lib/i18n/fa";
import type { ProductPublicationStatus } from "@/lib/types/marketplace";
import type { VendorStatus } from "@/lib/types/vendor";

const vendorStatusLabels: Record<VendorStatus, string> = {
  draft: fa.vendor.statusDraft,
  pending_review: fa.vendor.statusPendingReview,
  active: fa.vendor.statusActive,
  suspended: fa.vendor.statusSuspended,
  rejected: fa.vendor.statusRejected,
  archived: fa.vendor.statusArchived,
};

const publicationStatusLabels: Record<ProductPublicationStatus, string> = {
  draft: fa.vendor.pubDraft,
  pending_review: fa.vendor.pubPendingReview,
  approved: fa.vendor.pubApproved,
  published: fa.vendor.pubPublished,
  rejected: fa.vendor.pubRejected,
  archived: fa.vendor.pubArchived,
};

export function vendorStatusLabel(status: VendorStatus): string {
  return vendorStatusLabels[status] ?? status;
}

export function publicationStatusLabel(status: ProductPublicationStatus | undefined): string {
  if (!status) return "—";
  return publicationStatusLabels[status] ?? status;
}

export function canVendorEditPublication(
  status: ProductPublicationStatus | undefined
): boolean {
  return status === "draft" || status === "rejected";
}

export function canVendorSubmitPublication(
  status: ProductPublicationStatus | undefined
): boolean {
  return status === "draft" || status === "rejected";
}
