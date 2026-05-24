import {
  buildProductBreadcrumbJsonLd,
  buildProductFaqJsonLd,
  buildProductJsonLd,
  buildProductReviewJsonLd,
} from "@/lib/seo/product";
import type { Product } from "@/lib/types";

export function ProductJsonLd({
  product,
  comments = [],
  questions = [],
}: {
  product: Product;
  comments?: Array<{
    id: string;
    authorName: string;
    body: string;
    rating: number;
    createdAt: Date;
  }>;
  questions?: Array<{
    id: string;
    body: string;
    answers: Array<{ id: string; body: string; isOfficial: boolean; createdAt: Date }>;
  }>;
}) {
  const productPayload = buildProductJsonLd(product);
  const reviewPayload = buildProductReviewJsonLd({ product, comments });
  const faqPayload = buildProductFaqJsonLd({ questions });
  const breadcrumbPayload = buildProductBreadcrumbJsonLd({ product });
  const payload = [productPayload, reviewPayload, breadcrumbPayload, faqPayload].filter(Boolean);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
