import type { OrderReturnStatus } from "@/lib/types";
import type { SupportRequestStatus } from "@/lib/server/support-request/support-request";

/** Customer-facing unified return lifecycle (support ticket + operational return) */
export const UNIFIED_RETURN_STATUS_KEYS = [
  "submitted",
  "reviewing",
  "approved",
  "completed",
  "declined",
  "cancelled",
] as const;

export type UnifiedReturnStatusKey = (typeof UNIFIED_RETURN_STATUS_KEYS)[number];

export const RETURN_ELIGIBLE_ORDER_STATUSES = [
  "processing",
  "crafting",
  "shipped",
  "delivered",
] as const;

export const OPEN_ORDER_RETURN_STATUSES: OrderReturnStatus[] = [
  "requested",
  "under_review",
  "approved",
];

export function toUnifiedStatusFromReturn(status: OrderReturnStatus): UnifiedReturnStatusKey {
  switch (status) {
    case "requested":
      return "submitted";
    case "under_review":
      return "reviewing";
    case "approved":
      return "approved";
    case "refunded":
      return "completed";
    case "rejected":
      return "declined";
    case "cancelled":
      return "cancelled";
    default:
      return "submitted";
  }
}

export function toUnifiedStatusFromSupport(status: SupportRequestStatus): UnifiedReturnStatusKey {
  switch (status) {
    case "pending":
      return "submitted";
    case "in_progress":
      return "reviewing";
    case "resolved":
      return "completed";
    case "rejected":
      return "declined";
    default:
      return "submitted";
  }
}

export function resolveUnifiedReturnStatus(input: {
  returnStatus?: OrderReturnStatus | null;
  supportStatus?: SupportRequestStatus | null;
}): UnifiedReturnStatusKey {
  if (input.returnStatus) return toUnifiedStatusFromReturn(input.returnStatus);
  if (input.supportStatus) return toUnifiedStatusFromSupport(input.supportStatus);
  return "submitted";
}

export function mapReturnStatusToSupportStatus(status: OrderReturnStatus): SupportRequestStatus {
  switch (status) {
    case "requested":
      return "pending";
    case "under_review":
    case "approved":
      return "in_progress";
    case "refunded":
      return "resolved";
    case "rejected":
    case "cancelled":
      return "rejected";
    default:
      return "pending";
  }
}

export function unifiedReturnStatusBadgeVariant(
  status: UnifiedReturnStatusKey
): "gold" | "turquoise" | "default" | "royal" {
  if (status === "submitted") return "gold";
  if (status === "reviewing") return "royal";
  if (status === "approved" || status === "completed") return "turquoise";
  return "default";
}

export function mapSupportStatusToReturnStatus(
  supportStatus: SupportRequestStatus,
  currentReturnStatus: OrderReturnStatus
): OrderReturnStatus | null {
  switch (supportStatus) {
    case "pending":
      return currentReturnStatus === "requested" ? null : "requested";
    case "in_progress":
      return currentReturnStatus === "under_review" ? null : "under_review";
    case "rejected":
      return currentReturnStatus === "rejected" ? null : "rejected";
    case "resolved":
      if (currentReturnStatus === "refunded") return null;
      if (currentReturnStatus === "approved") return "refunded";
      if (currentReturnStatus === "under_review") return "approved";
      return null;
    default:
      return null;
  }
}
