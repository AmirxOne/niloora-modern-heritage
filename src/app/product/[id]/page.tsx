import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductJsonLd } from "@/components/seo/ProductJsonLd";
import { fa } from "@/lib/i18n/fa";
import { buildProductMetadata } from "@/lib/seo/product";
import { buildPageMetadata } from "@/lib/seo/site";
import { getProductPagePayload } from "@/lib/server/products/product-page";
import { ProductPageClient } from "./ProductPageClient";

type PageProps = {
  params: Promise<{ id: string }>;
};

/** Fresh UGC (comments/questions) on every product page load. */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const payload = await getProductPagePayload(id);
  if (payload) {
    return buildProductMetadata(payload.product);
  }

  return buildPageMetadata({
    title: fa.seo.productNotFound,
    description: fa.seo.productNotFoundDescription,
    path: `/product/${id}`,
    noIndex: true,
  });
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  const payload = await getProductPagePayload(id);
  if (!payload) notFound();

  return (
    <>
      <ProductJsonLd
        product={payload.product}
        comments={payload.approvedComments}
        questions={payload.approvedQuestions}
      />
      <ProductPageClient productId={id} initialPayload={payload} />
    </>
  );
}
