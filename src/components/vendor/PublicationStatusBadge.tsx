import { publicationStatusLabel } from "@/lib/vendor/labels";
import type { ProductPublicationStatus } from "@/lib/types/marketplace";
import { cn } from "@/lib/utils";

const tone: Record<ProductPublicationStatus, string> = {
  draft: "bg-neutral-100 text-neutral-700",
  pending_review: "bg-amber-50 text-amber-800",
  approved: "bg-sky-50 text-sky-800",
  published: "bg-emerald-50 text-emerald-800",
  rejected: "bg-red-50 text-red-800",
  archived: "bg-neutral-100 text-neutral-500",
};

export function PublicationStatusBadge({
  status,
}: {
  status: ProductPublicationStatus | undefined;
}) {
  if (!status) return null;
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-medium",
        tone[status] ?? tone.draft
      )}
    >
      {publicationStatusLabel(status)}
    </span>
  );
}
