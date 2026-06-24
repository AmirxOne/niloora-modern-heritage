import Link from "next/link";
import type { Product } from "@/lib/types";
import { VendorTrustBadge } from "@/components/vendor/VendorTrustBadge";
import { fa } from "@/lib/i18n/fa";
import { vendorStatusLabel } from "@/lib/vendor/labels";

export function ProductVendorPanel({ product }: { product: Product }) {
  const vendor = product.vendor;
  if (!vendor) return null;

  const statusNote =
    vendor.status !== "active" ? vendorStatusLabel(vendor.status) : null;

  return (
    <section
      className="product-detail-side-section"
      aria-labelledby="product-vendor-heading"
    >
      <h2 id="product-vendor-heading" className="product-detail-section-title">
        {fa.product.vendorTitle}
      </h2>
      <div className="space-y-2 text-sm text-silver">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-base font-medium text-ivory">{vendor.displayName}</p>
          <VendorTrustBadge trustScore={vendor.trustScore} />
        </div>
        {statusNote ? (
          <p className="text-xs text-amber-800">{statusNote}</p>
        ) : null}
        <Link
          href={`/vendor/${vendor.slug}`}
          className="inline-flex text-turquoise-dark underline-offset-2 hover:underline"
        >
          {fa.product.vendorViewStore}
        </Link>
      </div>
    </section>
  );
}
