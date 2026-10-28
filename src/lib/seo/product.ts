import type { Metadata } from "next";
import type { Product } from "@/lib/types";
import { fa } from "@/lib/i18n/fa";
import { isProductPurchasable } from "@/lib/products/purchasability";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo/site";

/**
 * SEO units note: the data model stores prices in TOMAN (site-wide).
 * Google supports IRR (rial), not toman — so JSON-LD converts the real
 * toman price ×10 to rial. Displayed page prices stay in toman (fa-IR).
 */

export function productMetaDescription(product: Product): string {
  const headline = product.listing?.headline?.trim();
  const details = product.listing?.details?.slice(0, 2).join(" · ");
  const parts = [
    headline,
    details,
    product.collection ? `مجموعه ${product.collection}` : null,
    product.seller?.shopName ? `از غرفه ${product.seller.shopName}` : null,
    `${product.namePersian || product.name}`,
  ].filter(Boolean);
  const text = parts.join(" — ");
  return text.length > 160 ? `${text.slice(0, 157)}…` : text;
}

export function buildProductMetadata(
  product: Product,
  options?: { noIndex?: boolean }
): Metadata {
  const title = product.namePersian || product.name;
  const description = productMetaDescription(product);
  const image = product.images?.[0] ?? product.image;

  return buildPageMetadata({
    title,
    description,
    path: `/product/${product.id}`,
    image,
    ogType: "website",
    noIndex: options?.noIndex,
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

  // toman → rial for schema.org IRR
  const priceRial = product.price * 10;

  const payload: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.namePersian || product.name,
    description: productMetaDescription(product),
    image: images,
    sku: product.id,
    brand: {
      "@type": "Brand",
      name: product.seller?.shopName ?? fa.brand.name,
    },
    category: product.collection ?? product.category,
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/product/${product.id}`),
      priceCurrency: "IRR",
      price: priceRial,
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition:
        product.condition === "pre-owned"
          ? "https://schema.org/UsedCondition"
          : "https://schema.org/NewCondition",
      // marketplace: the shop actually selling this item
      ...(product.seller
        ? {
            seller: {
              "@type": "Organization",
              name: product.seller.shopName,
              url: absoluteUrl("/shop"),
            },
          }
        : {}),
    },
  };

  if (product.name !== product.namePersian) {
    payload.alternateName = product.name;
  }

  return payload;
}

/** BreadcrumbList matching the visible ProductBreadcrumb component. */
export function buildBreadcrumbJsonLd(product: Product) {
  const items: Array<{ name: string; url: string }> = [
    { name: "صفحه اصلی", url: absoluteUrl("/") },
    { name: "گالری", url: absoluteUrl("/shop") },
  ];
  if (product.collection && product.collectionId) {
    items.push({
      name: product.collection,
      url: absoluteUrl(`/shop?collection=${encodeURIComponent(product.collectionId)}`),
    });
  }
  items.push({
    name: product.namePersian || product.name,
    url: absoluteUrl(`/product/${product.id}`),
  });

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
