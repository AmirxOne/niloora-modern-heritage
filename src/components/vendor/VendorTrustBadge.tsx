"use client";

import { fa } from "@/lib/i18n/fa";
import { shouldShowVendorTrustBadge } from "@/lib/marketplace/vendor-trust-shared";
import { cn } from "@/lib/utils";

export function VendorTrustBadge({
  trustScore,
  className,
}: {
  trustScore?: number;
  className?: string;
}) {
  if (trustScore == null || !shouldShowVendorTrustBadge(trustScore)) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-turquoise/10 px-2.5 py-0.5 text-xs font-medium text-turquoise-dark",
        className
      )}
    >
      {fa.vendor.trustBadge(trustScore)}
    </span>
  );
}
