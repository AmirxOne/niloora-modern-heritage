"use client";

import { cn } from "@/lib/utils";

interface ProductCardSkeletonProps {
  className?: string;
}

export function ProductCardSkeleton({ className }: ProductCardSkeletonProps) {
  return (
    <article className={cn("shop-product-card", className)} aria-busy="true">
      {/* تصویر */}
      <div className="sk aspect-[4/5] w-full rounded-none" style={{ borderRadius: "1rem 1rem 0 0" }} />

      <div className="shop-product-card-body">
        <div className="sk h-4 w-3/4" />
        <div className="sk mt-1 h-3 w-1/2" />
        <div className="shop-product-card-footer-compact mt-2">
          <div className="sk h-5 w-24" />
          <div className="sk h-8 w-8 rounded-full" />
        </div>
      </div>
    </article>
  );
}
