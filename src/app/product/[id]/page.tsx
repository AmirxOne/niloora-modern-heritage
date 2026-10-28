import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductJsonLd } from "@/components/seo/ProductJsonLd";
import { fa } from "@/lib/i18n/fa";
import { buildProductMetadata, buildBreadcrumbJsonLd } from "@/lib/seo/product";
import { buildPageMetadata } from "@/lib/seo/site";
import { getTelegramProductById } from "@/lib/server/telegram/sync";
import {
  getProductPagePayload,
  listProductIdsForSitemap,
} from "@/lib/server/products/product-page";
import { ProductPageClient } from "./ProductPageClient";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  const products = await listProductIdsForSitemap();
  return products.map((product) => ({ id: product.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const payload = await getProductPagePayload(id);
  if (payload) {
    // products of suspended/pending sellers are hidden from the catalog —
    // their pages must not be indexed either (stay crawlable for 404 later)
    const sellerHidden = Boolean(
      payload.product.seller && payload.product.seller.status !== "active"
    );
    return buildProductMetadata(payload.product, { noIndex: sellerHidden });
  }

  const telegram = await getTelegramProductById(id);
  if (telegram) {
    const title = telegram.title?.trim() || fa.seo.productNotFound;
    const description =
      telegram.description.trim().length > 160
        ? `${telegram.description.trim().slice(0, 157)}…`
        : telegram.description.trim();
    return buildPageMetadata({
      title,
      description,
      path: `/product/${id}`,
      image: telegram.images[0] ?? null,
    });
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
  if (!payload) {
    const telegram = await getTelegramProductById(id);
    if (!telegram) notFound();
    return <ProductPageClient productId={id} />;
  }

  return (
    <>
      <ProductJsonLd product={payload.product} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildBreadcrumbJsonLd(payload.product)
          ).replace(/</g, "\\u003c"),
        }}
      />
      <ProductPageClient productId={id} initialPayload={payload} />
    </>
  );
}
