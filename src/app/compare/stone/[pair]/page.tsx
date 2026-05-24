import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buildStoneCompareJsonLd, buildStoneCompareMetadata, listStoneCompareParams, parseStoneComparePair, resolveStoneCompareData } from "@/lib/seo/stone-compare";
import { getCatalogProducts } from "@/lib/server/products";
import { ShopProductGrid } from "@/components/shop/ShopProductGrid";
import { fa } from "@/lib/i18n/fa";

type PageProps = {
  params: Promise<{ pair: string }>;
};

export async function generateStaticParams() {
  return listStoneCompareParams();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { pair } = await params;
  const parsed = parseStoneComparePair(pair);
  if (!parsed) {
    return {
      title: "مقایسه یافت نشد",
      robots: { index: false, follow: false },
    };
  }
  const data = resolveStoneCompareData(parsed.leftSlug, parsed.rightSlug);
  if (!data) {
    return {
      title: "مقایسه یافت نشد",
      robots: { index: false, follow: false },
    };
  }
  return buildStoneCompareMetadata(data);
}

export default async function StoneComparePage({ params }: PageProps) {
  const { pair } = await params;
  const parsed = parseStoneComparePair(pair);
  if (!parsed) notFound();

  const data = resolveStoneCompareData(parsed.leftSlug, parsed.rightSlug);
  if (!data) notFound();

  const catalog = await getCatalogProducts();
  const leftProducts = data.leftCoreStone
    ? catalog.filter((p) => p.stone === data.leftCoreStone).slice(0, 4)
    : [];
  const rightProducts = data.rightCoreStone
    ? catalog.filter((p) => p.stone === data.rightCoreStone).slice(0, 4)
    : [];
  const jsonLd = buildStoneCompareJsonLd(data);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="compare-content-page min-h-screen bg-matte pb-16 pt-24">
        <div className="site-container">
          <header className="compare-content-head">
            <p className="compare-content-eyebrow">{fa.brand.name}</p>
            <h1>{data.title}</h1>
            <p>{data.intro}</p>
          </header>

          <section className="compare-content-card">
            <h2>تفاوت‌های کلیدی</h2>
            <ul>
              {data.differences.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="compare-content-card">
            <h2>برای چه کسانی مناسب‌تر است؟</h2>
            <ul>
              {data.useCases.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="compare-content-grid">
            {data.leftCoreStone ? (
              <article className="compare-content-cta">
                <h3>محصولات مرتبط با {data.leftName}</h3>
                <p>مدل‌های موجود با این سنگ را یکجا ببینید.</p>
                <Link href={`/shop?stones=${data.leftCoreStone}`}>مشاهده در فروشگاه</Link>
              </article>
            ) : null}
            {data.rightCoreStone ? (
              <article className="compare-content-cta">
                <h3>محصولات مرتبط با {data.rightName}</h3>
                <p>مدل‌های منتخب این سنگ در گالری.</p>
                <Link href={`/shop?stones=${data.rightCoreStone}`}>مشاهده در فروشگاه</Link>
              </article>
            ) : null}
          </section>

          {leftProducts.length > 0 ? (
            <section className="compare-content-products">
              <h2>{data.leftName} در فروشگاه</h2>
              <ShopProductGrid products={leftProducts} />
            </section>
          ) : null}

          {rightProducts.length > 0 ? (
            <section className="compare-content-products">
              <h2>{data.rightName} در فروشگاه</h2>
              <ShopProductGrid products={rightProducts} />
            </section>
          ) : null}
        </div>
      </div>
    </>
  );
}
