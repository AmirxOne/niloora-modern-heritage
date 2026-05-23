"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type EmptyStateVisual = "compare" | "cart" | "blog" | "reviews" | "questions" | "orders" | "shop";

const IMAGE_BY_VISUAL: Record<EmptyStateVisual, string> = {
  compare: "/empty-compare-jewel.svg",
  cart: "/empty-cart-jewel.svg",
  blog: "/empty-blog-jewel.svg",
  reviews: "/empty-reviews-jewel.svg",
  questions: "/empty-questions-jewel.svg",
  orders: "/empty-orders-jewel.svg",
  shop: "/empty-shop-jewel.svg",
};

interface UnifiedEmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  visual?: EmptyStateVisual;
  className?: string;
}

export function UnifiedEmptyState({
  title,
  description,
  action,
  visual = "shop",
  className,
}: UnifiedEmptyStateProps) {
  const image = IMAGE_BY_VISUAL[visual];
  return (
    <div className={cn("unified-empty-state", className)}>
      <div className="unified-empty-state__visual" aria-hidden>
        <Image src={image} alt="" fill sizes="(max-width: 768px) 220px, 280px" className="object-contain" />
      </div>
      <h2 className="unified-empty-state__title">{title}</h2>
      {description ? <p className="unified-empty-state__desc">{description}</p> : null}
      {action ? <div className="unified-empty-state__action">{action}</div> : null}
    </div>
  );
}

