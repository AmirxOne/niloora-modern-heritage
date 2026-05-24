import type { Metadata } from "next";
import Link from "next/link";
import { PageTransition } from "@/components/layout/PageTransition";
import { listAllArtisans } from "@/lib/artisans";
import { fa } from "@/lib/i18n/fa";
import { buildPageMetadata } from "@/lib/seo/site";
import { ArtisansSearchGrid } from "./ArtisansSearchGrid";

export const metadata: Metadata = buildPageMetadata({
  title: `${fa.artisans.title} | ${fa.brand.name}`,
  description: fa.artisans.subtitle,
  path: "/artisans",
});

export default function ArtisansPage() {
  const artisans = listAllArtisans();

  return (
    <PageTransition>
      <div className="artisans-page min-h-screen pb-24 pt-20 md:pt-24">
        <div className="site-container">
          <div className="artisans-page-shell">
            <header className="artisans-page-header">
              <span className="heritage-eyebrow">{fa.artisans.eyebrow}</span>
              <h1 className="artisans-page-title">{fa.artisans.title}</h1>
              <p className="artisans-page-subtitle">{fa.artisans.subtitle}</p>
            </header>

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

