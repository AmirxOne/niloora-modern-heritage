"use client";

import { cn } from "@/lib/utils";

interface ProductCardSkeletonProps {
  className?: string;
}

export function ProductCardSkeleton({ className }: ProductCardSkeletonProps) {
  return (
    <article className={cn("shop-product-card", className)} aria-busy="true">
      <div className="shop-product-card-thumbnail-stack sk" />

      <div className="shop-product-card-footer">
        <div className="sk h-4 w-4/5 rounded-sm" />
        <div className="shop-product-card-footer-bottomline">
          <div className="flex min-w-0 items-center gap-1.5">
            <div className="sk h-[1.375rem] w-[1.375rem] shrink-0 rounded-full" />
            <div className="sk h-3 w-14 rounded-sm" />
          </div>
          <div className="sk h-5 w-20 rounded-sm" />
        </div>
      </div>
    </article>
  );
}
