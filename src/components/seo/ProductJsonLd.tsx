import { buildProductJsonLd } from "@/lib/seo/product";
import type { Product } from "@/lib/types";

export function ProductJsonLd({ product }: { product: Product }) {
  const payload = buildProductJsonLd(product);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
