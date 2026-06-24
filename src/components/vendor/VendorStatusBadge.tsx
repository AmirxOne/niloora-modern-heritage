import { vendorStatusLabel } from "@/lib/vendor/labels";
import type { VendorStatus } from "@/lib/types/vendor";
import { cn } from "@/lib/utils";

const tone: Record<VendorStatus, string> = {
  draft: "bg-neutral-100 text-neutral-700",
  pending_review: "bg-amber-50 text-amber-800",
  active: "bg-emerald-50 text-emerald-800",
  suspended: "bg-orange-50 text-orange-800",
  rejected: "bg-red-50 text-red-800",
  archived: "bg-neutral-100 text-neutral-500",
};

export function VendorStatusBadge({ status }: { status: VendorStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-medium",
        tone[status] ?? tone.draft
      )}
    >
      {vendorStatusLabel(status)}
    </span>
  );
}
