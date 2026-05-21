"use client";

import Link from "next/link";
import type { Product } from "@/lib/types";
import { fa } from "@/lib/i18n/fa";
import { formatPrice } from "@/lib/utils";
import {
  estimateBuybackPrice,
  getPreOwnedGradeLabel,
  isPreOwnedProduct,
} from "@/lib/pre-owned";
import { Button } from "@/components/ui/Button";
import { RefreshCw, ShieldCheck, Sparkles } from "@/components/icons";
import { ICON_VARIANT, iconSizes } from "@/lib/icons";

interface PreOwnedProductPanelProps {
  product: Product;
}

export function PreOwnedProductPanel({ product }: PreOwnedProductPanelProps) {
  if (!isPreOwnedProduct(product) || !product.preOwned) return null;

  const info = product.preOwned;
  const buyback = estimateBuybackPrice(product);

  return (
    <section className="pre-owned-product-panel" aria-labelledby="pre-owned-panel-heading">
      <h2 id="pre-owned-panel-heading" className="pre-owned-product-panel-title">
        {fa.preOwned.shopStripTitle}
      </h2>

      <ul className="pre-owned-product-panel-features">
        <li>
          <ShieldCheck size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />
          <span>
            {fa.preOwned.refurbished} · {getPreOwnedGradeLabel(info.grade)}
          </span>
        </li>
        <li>
          <Sparkles size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />
          <span>{fa.preOwned.savings(info.depreciationPercent)}</span>
        </li>
        {info.canRemake ? (
          <li>
            <RefreshCw size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />
            <span>{fa.preOwned.canRemake}</span>
          </li>
        ) : null}
      </ul>

      {info.story ? <p className="pre-owned-product-panel-story">{info.story}</p> : null}

      <p className="pre-owned-product-panel-original">
        {fa.preOwned.vsNew}:{" "}
        <span className="line-through opacity-70">{formatPrice(info.originalPrice)}</span>
      </p>

      {buyback != null ? (
        <p className="pre-owned-product-panel-buyback">{fa.preOwned.buybackHint(formatPrice(buyback))}</p>
      ) : null}

      <div className="pre-owned-product-panel-actions">
        {info.canRemake ? (
          <Link href={`/customize?from=${product.id}`} className="flex-1">
            <Button variant="outline" className="w-full">
              {fa.preOwned.remakeCta}
            </Button>
          </Link>
        ) : null}
        <Link href="/pre-owned/sell" className="flex-1">
          <Button variant="ghost" className="w-full">
            {fa.preOwned.sellCta}
          </Button>
        </Link>
      </div>
    </section>
  );
}
