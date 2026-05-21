import type { Product, RingStyle } from "@/lib/types";
import { METAL_OPTIONS, STONE_OPTIONS, SHAPE_OPTIONS, ENGRAVING_STYLES } from "@/lib/constants";
import { fa } from "@/lib/i18n/fa";
import { cn } from "@/lib/utils";

const styleLabels: Record<RingStyle, string> = {
  solitaire: fa.shop.styles.solitaire,
  halo: fa.shop.styles.halo,
  vintage: fa.shop.styles.vintage,
  signet: fa.shop.styles.signet,
  eternity: fa.shop.styles.eternity,
  stackable: fa.shop.styles.stackable,
};

export function getProductSpecEntries(product: Product) {
  const metalLabel = METAL_OPTIONS.find((m) => m.value === product.metal)?.label ?? "";
  const stoneLabel = STONE_OPTIONS.find((s) => s.value === product.stone)?.label ?? "";
  const shapeLabel = SHAPE_OPTIONS.find((s) => s.value === product.stoneShape)?.label ?? "";
  const engravingLabel =
    product.engravingType === "none"
      ? fa.shop.engravingOptions.none
      : ENGRAVING_STYLES.find((e) => e.value === product.engravingType)?.label ?? "";

  return [
    { key: fa.shop.style, value: styleLabels[product.category] },
    { key: fa.shop.quickViewMetal, value: metalLabel },
    { key: fa.shop.quickViewStone, value: stoneLabel },
    { key: fa.customize.labels.stoneShape, value: shapeLabel },
    { key: fa.shop.engraving, value: engravingLabel },
  ];
}

interface ProductSpecsProps {
  product: Product;
  className?: string;
  /** When set, renders a visible heading inside the block (e.g. quick view). */
  title?: string;
}

export function ProductSpecs({ product, className, title }: ProductSpecsProps) {
  const entries = getProductSpecEntries(product);
  const ariaLabel = title ?? fa.product.featuresTitle;

  return (
    <section className={cn("product-specs", className)} aria-label={ariaLabel}>
      {title ? <h3 className="product-specs__title">{title}</h3> : null}
      <ul className="product-specs__list">
        {entries.map(({ key, value }) => (
          <li key={key}>
            <span className="product-specs__key">{key}</span>
            <span className="product-specs__val">{value}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
