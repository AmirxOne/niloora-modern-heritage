import Link from "next/link";
import type { Product } from "@/lib/types";
import { fa } from "@/lib/i18n/fa";
import { getProductArtisanLinks } from "@/lib/artisans";
import { getProductStatusConfig } from "@/lib/product-status";
import { resolveProductSpecs } from "@/lib/products/product-specs";

interface ProductStoryCardProps {
  product: Product;
  className?: string;
}

function formatFirstAvailable(iso?: string | null): string | null {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("fa-IR", { year: "numeric", month: "long" }).format(d);
  } catch {
    return null;
  }
}

function buildInspiration(product: Product): string {
  const parts: string[] = [];
  if (product.collection) {
    parts.push(`این طرح از مجموعه «${product.collection}» الهام گرفته است.`);
  }
  if (product.listing?.headline?.trim()) {
    parts.push(product.listing.headline.trim());
  }
  return parts.join(" ") || fa.product.storyCard.defaultInspiration;
}

export function ProductStoryCard({ product, className }: ProductStoryCardProps) {
  const artisans = getProductArtisanLinks(product);
  const status = getProductStatusConfig(product.availability);
  const specs = resolveProductSpecs(product);
  const firstAvailable = formatFirstAvailable(specs.firstAvailableAt);
  const artisanNames = Array.from(new Set(artisans.map((a) => a.artisan.name)));
  const artisanNarrative = artisanNames.length > 0
    ? artisanNames.join("، ")
    : specs.craftedBy || fa.product.storyCard.fallbackArtisan;

  return (
    <section className={`product-story-card ${className ?? ""}`.trim()} aria-labelledby="product-story-card-title">
      <header className="product-story-card__head">
        <span className="product-story-card__eyebrow">{fa.about.processEyebrow}</span>
        <h2 id="product-story-card-title" className="product-story-card__title">
          {fa.product.storyCard.title}
        </h2>
        <p className="product-story-card__subtitle">{fa.product.storyCard.subtitle}</p>
      </header>

      <div className="product-story-card__grid">
        <article className="product-story-card__panel">
          <h3 className="product-story-card__panel-title">{fa.product.storyCard.artisansTitle}</h3>
          <p className="product-story-card__text">{artisanNarrative}</p>
          {artisans.length > 0 ? (
            <div className="product-story-card__chips">
              {artisans.map((item) => (
                <Link key={`${item.role}-${item.artisan.slug}`} href={`/artisans/${item.artisan.slug}`} className="product-story-card__chip">
                  {item.roleLabel}
                </Link>
              ))}
            </div>
          ) : null}
        </article>

        <article className="product-story-card__panel">
          <h3 className="product-story-card__panel-title">{fa.product.storyCard.buildTimeTitle}</h3>
          <p className="product-story-card__text">{status.deliveryHint}</p>
          {firstAvailable ? (
            <p className="product-story-card__meta">{fa.product.storyCard.craftedSince(firstAvailable)}</p>
          ) : null}
        </article>

        <article className="product-story-card__panel">
          <h3 className="product-story-card__panel-title">{fa.product.storyCard.inspirationTitle}</h3>
          <p className="product-story-card__text">{buildInspiration(product)}</p>
        </article>

        <article className="product-story-card__panel">
          <h3 className="product-story-card__panel-title">{fa.product.storyCard.heritageTitle}</h3>
          <p className="product-story-card__text">
            این اثر با شمارهٔ قطعهٔ اختصاصی، استاندارد کارگاهی و روایت ساخت شفاف ارائه می‌شود تا مشتری تصویر دقیقی از مسیر خلق قطعه داشته باشد.
          </p>
          <div className="product-story-card__actions">
            <Link href="/artisans" className="product-story-card__link">
              {fa.product.storyCard.viewAllArtisans}
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
