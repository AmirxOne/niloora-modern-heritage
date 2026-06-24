export const VENDOR_TRUST_BADGE_THRESHOLD = 70;

export function shouldShowVendorTrustBadge(score: number): boolean {
  return score >= VENDOR_TRUST_BADGE_THRESHOLD;
}
