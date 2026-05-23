import type { Product } from "@/lib/types";
import { fa } from "@/lib/i18n/fa";
import { cn } from "@/lib/utils";
import {
  getProductHighlights,
  getProductOccasionLabels,
  resolveProductSpecs,
} from "@/lib/products/product-specs";
import type { ComponentType } from "react";
import {
  ShieldCheck,
  Hammer,
  BadgeCheck,
  Heart,
  Sparkles,
} from "@/components/icons";
import { ICON_VARIANT, iconSizes } from "@/lib/icons";

type IconComponent = ComponentType<{
  size?: number;
  variant?: typeof ICON_VARIANT;
}>;

const ICON_BY_ID: Record<string, IconComponent> = {
  "material-safe": ShieldCheck as unknown as IconComponent,
  "free-resize": Sparkles as unknown as IconComponent,
  handcrafted: Hammer as unknown as IconComponent,
  warranty: BadgeCheck as unknown as IconComponent,
  gift: Heart as unknown as IconComponent,
};

interface ProductHighlightsProps {
  product: Product;
  className?: string;
}

export function ProductHighlights({ product, className }: ProductHighlightsProps) {
  const highlights = getProductHighlights(product);
  const resolved = resolveProductSpecs(product);
  const occasions = getProductOccasionLabels(product);

  if (highlights.length === 0) return null;

  return (
    <section className={cn("product-highlights", className)} aria-labelledby="product-highlights-title">
      <header className="product-highlights__head">
        <h2 id="product-highlights-title" className="product-highlights__title">
          {fa.productHighlights.title}
        </h2>
        <p className="product-highlights__subtitle">{fa.productHighlights.subtitle}</p>
      </header>

      <ul className="product-highlights__list">
        {highlights.map((item) => {
          const Icon: IconComponent =
            ICON_BY_ID[item.id] ?? (BadgeCheck as unknown as IconComponent);
          return (
            <li key={item.id} className="product-highlights__item">
              <span className="product-highlights__icon" aria-hidden>
                <Icon size={iconSizes.sm} variant={ICON_VARIANT} />
              </span>
              <div className="product-highlights__body">
                <p className="product-highlights__group">{item.groupTitle}</p>
                <p className="product-highlights__text">{item.body}</p>
              </div>
            </li>
          );
        })}
      </ul>

      <footer className="product-highlights__footer">
        <div className="product-highlights__meta">
          <span className="product-highlights__meta-key">
            {fa.productHighlights.safetyHallmarkLead}
          </span>
          <span className="product-highlights__meta-val" dir="ltr">
            {resolved.metalStamp}
          </span>
        </div>
        {occasions.length > 0 ? (
          <div className="product-highlights__occasions">
            <span className="product-highlights__meta-key">
              {fa.productHighlights.occasionsLead}
            </span>
            <ul className="product-highlights__occasion-chips" aria-label={fa.productSpecs.occasion}>
              {occasions.map((label) => (
                <li key={label} className="product-highlights__occasion-chip">
                  {label}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </footer>
    </section>
  );
}
