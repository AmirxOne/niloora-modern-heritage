import type { ProductPublicationStatus } from "@/lib/types/marketplace";

export type PublicationRole = "admin" | "vendor";

export type ProductModerationAction =
  | "submitted"
  | "approved"
  | "rejected"
  | "published"
  | "edited_by_admin"
  | "archived";

const VENDOR_TRANSITIONS: Partial<
  Record<ProductPublicationStatus, readonly ProductPublicationStatus[]>
> = {
  draft: ["pending_review"],
  rejected: ["pending_review"],
};

const ADMIN_TRANSITIONS: Partial<
  Record<ProductPublicationStatus, readonly ProductPublicationStatus[]>
> = {
  pending_review: ["published", "rejected"],
  approved: ["published", "archived"],
  published: ["archived"],
};

export function canTransition(
  from: ProductPublicationStatus | null,
  to: ProductPublicationStatus,
  role: PublicationRole
): boolean {
  if (from === null) {
    return role === "vendor" && to === "draft";
  }

  const allowed =
    role === "vendor"
      ? VENDOR_TRANSITIONS[from]
      : ADMIN_TRANSITIONS[from];

  return allowed?.includes(to) ?? false;
}

export function assertPublicationTransition(
  from: ProductPublicationStatus | null,
  to: ProductPublicationStatus,
  role: PublicationRole,
  errorCode = "PRODUCT_TRANSITION_INVALID"
): ProductPublicationStatus {
  if (!canTransition(from, to, role)) {
    throw new Error(errorCode);
  }
  return to;
}

export function moderationActionForTransition(
  from: ProductPublicationStatus | null,
  to: ProductPublicationStatus,
  role: PublicationRole
): ProductModerationAction {
  if (role === "vendor" && to === "pending_review") return "submitted";
  if (role === "admin" && to === "published" && from === "pending_review") return "approved";
  if (role === "admin" && to === "rejected") return "rejected";
  if (role === "admin" && to === "archived") return "archived";
  if (from === null && to === "draft") return "submitted";
  return "published";
}
