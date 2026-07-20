import type { Metadata } from "next";
import Image from "next/image";
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

        <header className="mx-auto max-w-5xl py-8 md:py-12">
          <div className="relative overflow-hidden rounded-[1.6rem] border border-subtle bg-matte">
            {storefront.bannerImageUrl ? (
              <Image
                src={storefront.bannerImageUrl}
                alt={fa.vendor.brandingBannerPreviewAlt}
                width={1400}
                height={420}
                className="h-44 w-full object-cover md:h-60"
                priority
              />
            ) : (
              <div className="h-44 w-full bg-gradient-to-l from-[#f6e6b6] via-[#f8efe0] to-[#f5f3ee] md:h-60" />
            )}
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute bottom-4 right-4 left-4 flex items-end gap-4 md:bottom-6 md:right-6 md:left-6">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-white/90 bg-white md:h-24 md:w-24">
                {storefront.profileImageUrl ? (
                  <Image
                    src={storefront.profileImageUrl}
                    alt={fa.vendor.brandingProfilePreviewAlt}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-silver">
                    {displayName.slice(0, 1)}
                  </div>
                )}
              </div>
              <div className="min-w-0 text-white">
                <p className="text-xs tracking-widest text-white/90">{fa.vendor.storefrontEyebrow}</p>
                <h1 className="mt-1 truncate font-display text-2xl md:text-4xl">{displayName}</h1>
              </div>
            </div>
          </div>
        </header>

        <header className="mx-auto max-w-3xl pb-8 text-center md:pb-10">
          <div className="flex flex-wrap items-center justify-center gap-3">
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
