import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ShopPageClientWithSeoLanding } from "@/app/shop/ShopPageClient";
import { buildPageMetadata, absoluteUrl } from "@/lib/seo/site";
import {
  isShopLandingFacet,
  listShopLandingParams,
  parseShopLandingSlug,
  shopLandingLabel,
  shopLandingPath,
  shopLandingSeoCopy,
  type ShopLandingFacet,
} from "@/lib/seo/landing-pages";
import type { ProductOccasion, RingStyle, StoneType } from "@/lib/types";
import { buildBreadcrumbJsonLd } from "@/lib/seo/structured-data";

type PageProps = {
  params: Promise<{ facet: string; slug: string }>;
};

function toShopQuery(facet: ShopLandingFacet, slug: StoneType | RingStyle | ProductOccasion): string {
  if (facet === "stone") return `/shop?stones=${slug}`;
  if (facet === "style") return `/shop?styles=${slug}`;
  return `/shop?occasion=${slug}`;
}

function buildCollectionPageJsonLd(input: {
  facet: ShopLandingFacet;
  slug: StoneType | RingStyle | ProductOccasion;
  title: string;
  description: string;
}) {
  const path = shopLandingPath(input.facet, input.slug);
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.title,
    description: input.description,
    inLanguage: "fa-IR",
    url: absoluteUrl(path),
    mainEntity: {
      "@type": "ItemList",
      name: shopLandingLabel(input.facet, input.slug),
      url: absoluteUrl(path),
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "خانه", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "فروشگاه", item: absoluteUrl("/shop") },
        {
          "@type": "ListItem",
          position: 3,
          name: shopLandingLabel(input.facet, input.slug),
          item: absoluteUrl(path),
        },
      ],
    },
  };
}

export async function generateStaticParams() {
  return listShopLandingParams();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { facet, slug } = await params;
  if (!isShopLandingFacet(facet)) {
    return buildPageMetadata({
      title: "صفحه یافت نشد",
      description: "لندینگ مورد نظر یافت نشد.",
      path: `/shop/${facet}/${slug}`,
      noIndex: true,
    });
  }
  const parsed = parseShopLandingSlug(facet, slug);
  if (!parsed) {
    return buildPageMetadata({
      title: "صفحه یافت نشد",
      description: "لندینگ مورد نظر یافت نشد.",
      path: `/shop/${facet}/${slug}`,
      noIndex: true,
    });
  }
  const seo = shopLandingSeoCopy(facet, parsed);
  return buildPageMetadata({
    title: seo.title,
    description: seo.description,
    path: shopLandingPath(facet, parsed),
  });
}

export default async function ShopLandingPage({ params }: PageProps) {
  const { facet, slug } = await params;
  if (!isShopLandingFacet(facet)) notFound();
  const parsed = parseShopLandingSlug(facet, slug);
  if (!parsed) notFound();

  // Keep one URL shape canonical per landing.
  const canonicalPath = shopLandingPath(facet, parsed);
  if (canonicalPath !== `/shop/${facet}/${slug}`) {
    redirect(canonicalPath);
  }

  const seo = shopLandingSeoCopy(facet, parsed);
  const jsonLd = buildCollectionPageJsonLd({
    facet,
    slug: parsed,
    title: seo.title,
    description: seo.description,
  });
  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "خانه", path: "/" },
    { name: "فروشگاه", path: "/shop" },
    { name: shopLandingLabel(facet, parsed), path: shopLandingPath(facet, parsed) },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, breadcrumb]) }}
      />
      <ShopPageClientWithSeoLanding
        seoLanding={{
          facet,
          slug: parsed,
          title: seo.title,
          intro: seo.intro,
          fallbackQueryHref: toShopQuery(facet, parsed),
        }}
      />
    </>
  );
}
