"use client";

import { fa } from "@/lib/i18n/fa";
import { cn } from "@/lib/utils";

interface PreOwnedBadgeProps {
  className?: string;
  size?: "sm" | "md";
}

export function PreOwnedBadge({ className, size = "sm" }: PreOwnedBadgeProps) {
  return (
    <span
      className={cn(
        "pre-owned-badge",
        size === "md" && "pre-owned-badge--md",
        className
      )}
    >
      {fa.shop.preOwnedBadge}
    </span>
  );
}
