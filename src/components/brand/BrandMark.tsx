"use client";

import Image from "next/image";
import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";
import {
  BRAND_MARK_VISUAL_ZOOM,
  resolveBrandLogoUrl,
} from "@/lib/brand/assets";
import { cn } from "@/lib/utils";

export function BrandMark({
  size = 41,
  zoom = BRAND_MARK_VISUAL_ZOOM,
  className,
  priority,
}: {
  size?: number;
  zoom?: number;
  className?: string;
  priority?: boolean;
}) {
  const site = useSiteSettings();
  const src = resolveBrandLogoUrl(site.logoUrl);
  const intrinsicSize = Math.max(128, Math.round(size * 3));

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center self-center overflow-hidden",
        className
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Image
        src={src}
        alt={`نشان ${site.brandName}`}
        width={intrinsicSize}
        height={intrinsicSize}
        quality={100}
        unoptimized
        priority={priority}
        className="h-full w-full origin-center object-contain object-center"
        style={zoom !== 1 ? { transform: `scale(${zoom})` } : undefined}
      />
    </span>
  );
}
