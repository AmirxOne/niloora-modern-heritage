import { VENDOR_TRUST_BADGE_THRESHOLD } from "@/lib/marketplace/vendor-trust-shared";
import type { VendorStatus } from "@/lib/types/vendor";

export { VENDOR_TRUST_BADGE_THRESHOLD, shouldShowVendorTrustBadge } from "@/lib/marketplace/vendor-trust-shared";

const MS_PER_DAY = 86_400_000;
const MAX_VENDOR_AGE_DAYS = 365;

export type VendorTrustInput = {
  status: VendorStatus;
  approvedAt: Date | null;
  createdAt: Date;
  avgCommentRating: number | null;
  returnRate: number | null;
};

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function ratingComponent(avgRating: number | null): number {
  if (avgRating == null || avgRating <= 0) return 50;
  return clampScore((avgRating / 5) * 100);
}

function returnRateComponent(returnRate: number | null): number {
  if (returnRate == null) return 70;
  const inverted = 1 - Math.min(1, Math.max(0, returnRate));
  return clampScore(inverted * 100);
}

function ageComponent(approvedAt: Date | null, createdAt: Date, now: Date): number {
  const anchor = approvedAt ?? createdAt;
  const ageDays = Math.max(0, (now.getTime() - anchor.getTime()) / MS_PER_DAY);
  const normalized = Math.min(ageDays / MAX_VENDOR_AGE_DAYS, 1);
  return clampScore(normalized * 100);
}

function statusComponent(status: VendorStatus): number {
  if (status === "active") return 100;
  if (status === "pending_review") return 40;
  return 0;
}

export function computeVendorTrustScore(
  input: VendorTrustInput,
  now: Date = new Date()
): number {
  if (input.status !== "active") {
    return clampScore(statusComponent(input.status) * 0.35);
  }

  const score =
    ratingComponent(input.avgCommentRating) * 0.35 +
    returnRateComponent(input.returnRate) * 0.25 +
    ageComponent(input.approvedAt, input.createdAt, now) * 0.2 +
    statusComponent(input.status) * 0.2;

  return clampScore(score);
}
