"use client";

import Link from "next/link";
import Image from "next/image";
import { useApp } from "@/lib/context/AppContext";
import { useProductsByIds } from "@/lib/hooks/useProductsByIds";
import { fa } from "@/lib/i18n/fa";
import { formatPrice } from "@/lib/utils";

export function RecentlyViewedStrip({
  excludeProductId,
  className,
}: {
  excludeProductId?: string;
  className?: string;
}) {
  const { recentlyViewed } = useApp();
  const ids = recentlyViewed.ids.filter((id) => id !== excludeProductId);
  const products = useProductsByIds(ids);

  if (products.length === 0) return null;

  return (
    <section className={className ?? "recently-viewed-strip"} aria-labelledby="recently-viewed-title">
      <div className="recently-viewed-strip__head">
        <h2 id="recently-viewed-title" className="recently-viewed-strip__title">
          {fa.product.recentlyViewedTitle}
        </h2>
      </div>
      <ul className="recently-viewed-strip__list">
        {products.map((product) => (
          <li key={product.id}>
            <Link href={`/product/${product.id}`} className="recently-viewed-strip__card">
              <span className="recently-viewed-strip__thumb">
                <Image
                  src={product.image}
                  alt=""
                  fill
                  sizes="120px"
                  className="object-cover"
                />
              </span>
              <span className="recently-viewed-strip__meta">
                <span className="recently-viewed-strip__name">{product.name}</span>
                <span className="recently-viewed-strip__price">{formatPrice(product.price)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
