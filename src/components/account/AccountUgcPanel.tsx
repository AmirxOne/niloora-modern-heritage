"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { UnifiedEmptyState } from "@/components/ui/UnifiedEmptyState";
import { useMyUgc } from "@/lib/hooks/useProductUgc";
import { fa } from "@/lib/i18n/fa";

function statusBadge(status: "pending" | "approved" | "rejected") {
  if (status === "approved") {
    return <Badge variant="turquoise">{fa.product.ugc.statusApproved}</Badge>;
  }
  if (status === "rejected") {
    return <Badge variant="default">{fa.product.ugc.statusRejected}</Badge>;
  }
  return <Badge variant="gold">{fa.product.ugc.statusPending}</Badge>;
}

export function AccountUgcPanel() {
  const { items, isLoading } = useMyUgc();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="product-ugc-card">
            <div className="sk aspect-square w-full rounded-xl" />
            <div className="sk mt-3 h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <UnifiedEmptyState
        visual="orders"
        title={fa.product.ugc.accountEmptyTitle}
        description={fa.product.ugc.accountEmptyHint}
      />
    );
  }

  return (
    <ul className="product-ugc-grid">
      {items.map((item) => (
        <li key={item.id} className="product-ugc-card">
          {item.mediaType === "image" ? (
            <div className="product-ugc-media">
              <Image src={item.mediaUrl} alt={item.caption ?? ""} fill className="object-cover" sizes="(max-width: 768px) 100vw, 320px" />
            </div>
          ) : (
            <div className="product-ugc-media product-ugc-media--video">
              <video src={item.mediaUrl} controls playsInline preload="metadata" />
            </div>
          )}
          <div className="product-ugc-card-meta">
            {statusBadge(item.status)}
            <Link href={`/product/${item.productId}`} className="product-ugc-product-link">
              {fa.product.ugc.viewProduct}
            </Link>
          </div>
          {item.caption ? <p className="product-ugc-caption">{item.caption}</p> : null}
        </li>
      ))}
    </ul>
  );
}
