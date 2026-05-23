"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { getProductArtisanLinks } from "@/lib/artisans";
import { fa } from "@/lib/i18n/fa";

interface ProductArtisansPanelProps {
  product: Product;
  className?: string;
}

export function ProductArtisansPanel({ product, className }: ProductArtisansPanelProps) {
  const links = getProductArtisanLinks(product);
  if (links.length === 0) return null;

  return (
    <section className={`product-artisans-panel ${className ?? ""}`.trim()} aria-labelledby="product-artisans-title">
      <header className="product-artisans-panel__head">
        <h2 id="product-artisans-title" className="product-artisans-panel__title">
          {fa.artisans.productPanelTitle}
        </h2>
        <p className="product-artisans-panel__subtitle">{fa.artisans.productPanelSubtitle}</p>
      </header>

      <ul className="product-artisans-panel__list">
        {links.map(({ role, roleLabel, artisan }) => (
          <li key={`${role}-${artisan.slug}`} className="product-artisans-panel__item">
            <div className="product-artisans-panel__media">
              <Image src={artisan.image} alt={artisan.name} fill sizes="56px" className="object-cover" />
            </div>
            <div className="product-artisans-panel__body">
              <p className="product-artisans-panel__role">{roleLabel}</p>
              <Link href={`/artisans/${artisan.slug}`} className="product-artisans-panel__name">
                {artisan.name}
              </Link>
              <p className="product-artisans-panel__meta">{artisan.title}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="product-artisans-panel__footer">
        <Link href="/artisans" className="product-artisans-panel__all-link">
          {fa.artisans.viewAll}
        </Link>
      </div>
    </section>
  );
}

