"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { EMPTY_STATE_IMAGES, type EmptyStateVisual } from "@/lib/images";
import { cn } from "@/lib/utils";

export type { EmptyStateVisual };

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
  const image = EMPTY_STATE_IMAGES[visual];
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

