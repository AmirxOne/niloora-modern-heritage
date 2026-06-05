import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageTransition } from "@/components/layout/PageTransition";
import { getStoneGuideBySlugForCatalog } from "@/lib/stones";
import { buildPageMetadata } from "@/lib/seo/site";
import { getCatalogProducts } from "@/lib/server/products";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 3600;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const catalog = await getCatalogProducts();
  const stone = getStoneGuideBySlugForCatalog(slug, catalog);
  if (!stone) {
    return buildPageMetadata({
      title: "سنگ یافت نشد",
      description: "سنگ مورد نظر در دانشنامه یافت نشد.",
      path: `/stones/${slug}`,
      noIndex: true,
    });
  }
  return buildPageMetadata({
    title: `${stone.name} | دانشنامه سنگ‌ها`,
    description: stone.shortTagline,
    path: `/stones/${slug}`,
  });
}

export default async function StoneDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const catalog = await getCatalogProducts();
  const stone = getStoneGuideBySlugForCatalog(slug, catalog);
  if (!stone) notFound();

  return (
    <PageTransition>
      <div className="stone-detail-page min-h-screen pb-24 pt-20 md:pt-24">
        <div className="site-container">
          <div className="stone-detail-shell">
            <header className="stone-detail-head">
              <div className="stone-detail-image-wrap">
                <Image
                  src={stone.image}
                  alt={stone.name}
                  fill
                  sizes="(max-width: 768px) 220px, 280px"
                  className="stone-detail-image"
                />
              </div>
              <h1 className="stone-detail-title">{stone.name}</h1>
              <p className="stone-detail-subtitle">{stone.shortTagline}</p>
            </header>

            <section className="stone-detail-section">
              <h2>تاریخچه و پیدایش</h2>
              <p>
                <strong>خاستگاه تاریخی:</strong> {stone.historicalOrigin}
              </p>
              <p>
                <strong>نخستین دوره استفاده شاخص:</strong> {stone.firstMajorUsePeriod}
              </p>
              <p>{stone.culturalStory}</p>
            </section>

            <section className="stone-detail-grid">
              <article className="stone-detail-card">
                <h3>اثرات روان‌شناختی رایج</h3>
                <ul>
                  {stone.psychologicalEffects.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>

              <article className="stone-detail-card">
                <h3>بیشتر به درد چه کسانی می‌خورد؟</h3>
                <ul>
                  {stone.recommendedFor.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            </section>

            <section className="stone-detail-grid">
              <article className="stone-detail-card">
                <h3>برداشت‌های معنوی سنتی</h3>
                <ul>
                  {stone.spiritualNotes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>

              <article className="stone-detail-card">
                <h3>نکات نگهداری و احتیاط</h3>
                <ul>
                  {stone.maintenanceTips.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                  {stone.cautionNotes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            </section>

            <div className="stone-detail-actions">
              <Link href="/stones" className="stone-detail-back">
                بازگشت به لیست سنگ‌ها
              </Link>
              <Link href={stone.coreStone ? `/shop?stone=${stone.coreStone}` : "/shop"} className="stone-detail-shop">
                مشاهده انگشترهای این سنگ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

