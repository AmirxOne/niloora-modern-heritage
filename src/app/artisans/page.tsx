import type { Metadata } from "next";
import Link from "next/link";
import { PageTransition } from "@/components/layout/PageTransition";
import { PageHeader } from "@/components/ui/PageHeader";
import { listArtisansForCatalog } from "@/lib/artisans";
import { fa } from "@/lib/i18n/fa";
import { buildPageMetadata } from "@/lib/seo/site";
import { getCatalogProducts } from "@/lib/server/products";
import { ArtisansSearchGrid } from "./ArtisansSearchGrid";

export const metadata: Metadata = buildPageMetadata({
  title: `${fa.artisans.title} | ${fa.brand.name}`,
  description: fa.artisans.subtitle,
  path: "/artisans",
});

export default async function ArtisansPage() {
  const catalog = await getCatalogProducts();
  const artisans = listArtisansForCatalog(catalog);

  return (
    <PageTransition>
      <div className="artisans-page min-h-screen pb-24 pt-20 md:pt-24">
        <div className="site-container">
          <div className="artisans-page-shell">
            <PageHeader
              eyebrow={fa.artisans.eyebrow}
              title={fa.artisans.title}
              subtitle={fa.artisans.subtitle}
              className="artisans-page-header"
            />

            <ArtisansSearchGrid artisans={artisans} />

            <div className="artisans-page-footer-link">
              <Link href="/shop">{fa.blog.backToShop}</Link>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

