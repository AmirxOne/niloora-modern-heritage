"use client";

import { useCallback, useState } from "react";
import { Heart, Share2 } from "@/components/icons";
import { fa } from "@/lib/i18n/fa";
import { useApp } from "@/lib/context/AppContext";
import { ICON_VARIANT, iconSizes } from "@/lib/icons";
import { cn } from "@/lib/utils";

interface ProductMediaActionsProps {
  productId: string;
  productName: string;
  className?: string;
}

export function ProductMediaActions({
  productId,
  productName,
  className,
}: ProductMediaActionsProps) {
  const { wishlist } = useApp();
  const wished = wishlist.isWishlisted(productId);
  const [shareNotice, setShareNotice] = useState<string | null>(null);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    const payload = {
      title: productName,
      text: fa.product.shareText(productName),
      url,
    };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(payload);
        return;
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setShareNotice(fa.product.shareCopied);
    } catch {
      setShareNotice(url);
    }

    window.setTimeout(() => setShareNotice(null), 2800);
  }, [productName]);

  return (
    <div className={cn("product-media-actions", className)}>
      <div className="product-media-actions-toolbar">
        <button
          type="button"
          className="product-media-actions-btn"
          onClick={handleShare}
          aria-label={fa.product.shareAria}
        >
          <Share2 size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />
          <span className="sr-only">{fa.product.share}</span>
        </button>
        <button
          type="button"
          className={cn(
            "product-media-actions-btn",
            wished && "product-media-actions-btn--active"
          )}
          onClick={() => wishlist.toggle(productId)}
          aria-label={wished ? fa.product.wishlistRemoveAria : fa.product.wishlistAddAria}
          aria-pressed={wished}
        >
          <Heart
            size={iconSizes.sm}
            variant={ICON_VARIANT}
            className={wished ? "fill-gold text-gold" : "text-ivory"}
            fill={wished ? "currentColor" : "none"}
            aria-hidden
          />
          <span className="sr-only">
            {wished ? fa.product.wishlisted : fa.product.wishlist}
          </span>
        </button>
      </div>
      {shareNotice ? (
        <p className="product-media-actions-toast" role="status">
          {shareNotice}
        </p>
      ) : null}
    </div>
  );
}
