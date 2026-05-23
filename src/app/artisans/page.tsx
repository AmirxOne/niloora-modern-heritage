import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageTransition } from "@/components/layout/PageTransition";
import { listAllArtisans } from "@/lib/artisans";
import { fa } from "@/lib/i18n/fa";
import { buildPageMetadata } from "@/lib/seo/site";

export const metadata: Metadata = buildPageMetadata({
  title: `${fa.artisans.title} | ${fa.brand.name}`,
  description: fa.artisans.subtitle,
  path: "/artisans",
});

export default function ArtisansPage() {
  const artisans = listAllArtisans();

  return (
    <PageTransition>
      <div className="artisans-page min-h-screen pb-24 pt-28 md:pt-32">
        <div className="site-container">
          <div className="artisans-page-shell">
            <header className="artisans-page-header">
              <span className="heritage-eyebrow">{fa.artisans.eyebrow}</span>
              <h1 className="artisans-page-title">{fa.artisans.title}</h1>
              <p className="artisans-page-subtitle">{fa.artisans.subtitle}</p>
            </header>

            <div className="artisans-grid">
              {artisans.map((artisan) => (
                <article key={artisan.slug} className="artisan-card">
                  <Link href={`/artisans/${artisan.slug}`} className="artisan-card-link">
                    <div className="artisan-card-image">
                      <Image src={artisan.image} alt={artisan.name} fill className="object-cover" />
                    </div>
                    <div className="artisan-card-body">
                      <h2 className="artisan-card-name">{artisan.name}</h2>
                      <p className="artisan-card-title">{artisan.title}</p>
                      <p className="artisan-card-specialty">{artisan.specialty}</p>
                      <p className="artisan-card-exp">
                        {fa.artisans.experienceYears(artisan.yearsExperience)}
                      </p>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

