import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageTransition } from "@/components/layout/PageTransition";
import { getArtisanBySlug, listAllArtisans } from "@/lib/artisans";
import { fa } from "@/lib/i18n/fa";
import { buildPageMetadata } from "@/lib/seo/site";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return listAllArtisans().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const artisan = getArtisanBySlug(slug);
  if (!artisan) {
    return buildPageMetadata({
      title: fa.notFound.title,
      description: fa.notFound.subtitle,
      path: `/artisans/${slug}`,
      noIndex: true,
    });
  }

  return buildPageMetadata({
    title: `${artisan.name} | ${fa.artisans.title}`,
    description: artisan.specialty,
    path: `/artisans/${slug}`,
    image: artisan.image,
  });
}

export default async function ArtisanDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const artisan = getArtisanBySlug(slug);
  if (!artisan) notFound();

  return (
    <PageTransition>
      <div className="artisan-detail-page min-h-screen pb-24 pt-28 md:pt-32">
        <div className="site-container">
          <div className="artisan-detail-shell">
            <div className="artisan-detail-top">
              <div className="artisan-detail-image">
                <Image src={artisan.image} alt={artisan.name} fill className="object-cover" />
              </div>
              <div className="artisan-detail-main">
                <p className="artisan-detail-eyebrow">{fa.artisans.eyebrow}</p>
                <h1 className="artisan-detail-name">{artisan.name}</h1>
                <p className="artisan-detail-title">{artisan.title}</p>
                <p className="artisan-detail-specialty">{artisan.specialty}</p>
                <p className="artisan-detail-bio">{artisan.bio}</p>
                <div className="artisan-detail-tags">
                  {artisan.roleTags.map((tag) => (
                    <span key={tag} className="artisan-detail-tag">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="artisan-detail-meta">
                  <span>{fa.artisans.experienceYears(artisan.yearsExperience)}</span>
                  <span className="artisan-detail-meta-sep">•</span>
                  <span>{artisan.location}</span>
                </div>
              </div>
            </div>

            <div className="artisan-detail-actions">
              <Link href="/artisans" className="artisan-detail-back-link">
                {fa.artisans.backToList}
              </Link>
              <Link href="/customize" className="artisan-detail-cta-link">
                {fa.artisans.ctaCustomize}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

