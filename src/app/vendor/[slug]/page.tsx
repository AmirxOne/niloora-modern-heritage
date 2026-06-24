import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageTransition } from "@/components/layout/PageTransition";
import { ShopProductGrid } from "@/components/shop/ShopProductGrid";
import { VendorTrustBadge } from "@/components/vendor/VendorTrustBadge";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { fa } from "@/lib/i18n/fa";
import { buildPageMetadata } from "@/lib/seo/site";
import { getPublicVendorStorefront } from "@/lib/server/vendor/public-vendor-storefront";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 3600;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const storefront = await getPublicVendorStorefront(slug);
  if (!storefront) {
    return buildPageMetadata({
      title: fa.vendor.storefrontNotFound,
      description: fa.vendor.storefrontNotFoundDescription,
      path: `/vendor/${slug}`,
      noIndex: true,
    });
  }

  const title = storefront.displayNameFa ?? storefront.displayName;
  return buildPageMetadata({
    title: `${title} | ${fa.vendor.storefrontTitle}`,
    description: storefront.description ?? fa.vendor.storefrontDefaultDescription(title),
    path: `/vendor/${storefront.slug}`,
  });
}

export default async function VendorStorefrontPage({ params }: PageProps) {
  const { slug } = await params;
  const storefront = await getPublicVendorStorefront(slug);
  if (!storefront) notFound();

  const displayName = storefront.displayNameFa ?? storefront.displayName;

  return (
    <PageTransition>
      <div className="site-container py-6 md:py-8">
        <Breadcrumb
          items={[
            { label: fa.nav.home, href: "/" },
            { label: fa.nav.shop, href: "/shop" },
            { label: displayName },
          ]}
        />

        <header className="mx-auto max-w-3xl py-8 text-center md:py-12">
          <p className="text-xs tracking-widest text-turquoise">{fa.vendor.storefrontEyebrow}</p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
            <h1 className="font-display text-3xl text-ivory md:text-4xl">{displayName}</h1>
            <VendorTrustBadge trustScore={storefront.trustScore} />
          </div>
          {storefront.description ? (
            <p className="mt-4 text-sm leading-relaxed text-silver md:text-base">
              {storefront.description}
            </p>
          ) : null}
        </header>

        <section aria-label={fa.vendor.storefrontProductsTitle}>
          {storefront.products.length === 0 ? (
            <p className="py-12 text-center text-silver">{fa.vendor.storefrontEmpty}</p>
          ) : (
            <ShopProductGrid products={storefront.products} />
          )}
        </section>
      </div>
    </PageTransition>
  );
}
