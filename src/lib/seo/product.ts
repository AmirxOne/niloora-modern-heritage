import type { Metadata } from "next";
import type { Product } from "@/lib/types";
import { fa } from "@/lib/i18n/fa";
import { isProductPurchasable } from "@/lib/products/purchasability";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo/site";
import { buildBreadcrumbJsonLd, buildFaqJsonLd } from "@/lib/seo/structured-data";

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

export function buildProductReviewJsonLd(input: {
  product: Product;
  comments: Array<{
    id: string;
    authorName: string;
    body: string;
    rating: number;
    createdAt: Date;
  }>;
}) {
  const comments = input.comments.filter((item) => item.rating >= 1 && item.rating <= 5);
  const count = comments.length;
  const average = count > 0 ? comments.reduce((sum, c) => sum + c.rating, 0) / count : 0;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": absoluteUrl(`/product/${input.product.id}#product`),
    name: input.product.namePersian || input.product.name,
    aggregateRating: count
      ? {
          "@type": "AggregateRating",
          ratingValue: Number(average.toFixed(1)),
          reviewCount: count,
        }
      : undefined,
    review: comments.slice(0, 10).map((comment) => ({
      "@type": "Review",
      reviewBody: comment.body,
      datePublished: comment.createdAt.toISOString(),
      author: {
        "@type": "Person",
        name: comment.authorName,
      },
      reviewRating: {
        "@type": "Rating",
        ratingValue: comment.rating,
        bestRating: 5,
        worstRating: 1,
      },
    })),
  };
}

export function buildProductFaqJsonLd(input: {
  questions: Array<{
    id: string;
    body: string;
    answers: Array<{ id: string; body: string; isOfficial: boolean; createdAt: Date }>;
  }>;
}) {
  const items = input.questions
    .map((q) => {
      const answer = q.answers.find((a) => a.isOfficial) ?? q.answers[0];
      if (!answer) return null;
      return { question: q.body, answer: answer.body };
    })
    .filter((item): item is { question: string; answer: string } => item !== null)
    .slice(0, 12);
  if (items.length === 0) return null;
  return buildFaqJsonLd(items);
}

export function buildProductBreadcrumbJsonLd(input: { product: Product }) {
  return buildBreadcrumbJsonLd([
    { name: "خانه", path: "/" },
    { name: "فروشگاه", path: "/shop" },
    {
      name: input.product.namePersian || input.product.name,
      path: `/product/${input.product.id}`,
    },
  ]);
}
