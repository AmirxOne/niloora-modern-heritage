import type { Metadata } from "next";
import type { Product } from "@/lib/types";
import { fa } from "@/lib/i18n/fa";
import { isProductPurchasable } from "@/lib/products/purchasability";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo/site";

export function productMetaDescription(product: Product): string {
  const headline = product.listing?.headline?.trim();
  const details = product.listing?.details?.slice(0, 2).join(" · ");
  const parts = [
    headline,
    details,
    product.collection ? `مجموعه ${product.collection}` : null,
    `${product.namePersian || product.name}`,
  ].filter(Boolean);
  const text = parts.join(" — ");
  return text.length > 160 ? `${text.slice(0, 157)}…` : text;
}

export function buildProductMetadata(product: Product): Metadata {
  const title = product.namePersian || product.name;
  const description = productMetaDescription(product);
  const image = product.images?.[0] ?? product.image;

  return buildPageMetadata({
    title,
    description,
    path: `/product/${product.id}`,
    image,
    ogType: "website",
  });
}

export function buildProductJsonLd(product: Product) {
  const images = (product.images?.length ? product.images : [product.image]).map((src) =>
    absoluteUrl(src)
  );
  const inStock = isProductPurchasable(
    {
      name: product.namePersian || product.name,
      availability: product.availability,
      stock: product.stock,
    },
    1
  );

  const payload: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.namePersian || product.name,
    description: productMetaDescription(product),
    image: images,
    sku: product.id,
    brand: {
      "@type": "Brand",
      name: fa.brand.name,
    },
    category: product.collection ?? product.category,
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/product/${product.id}`),
      priceCurrency: "IRR",
      price: product.price,
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition:
        product.condition === "pre-owned"
          ? "https://schema.org/UsedCondition"
          : "https://schema.org/NewCondition",
    },
  };

  if (product.name !== product.namePersian) {
    payload.alternateName = product.name;
  }

  return payload;
}
