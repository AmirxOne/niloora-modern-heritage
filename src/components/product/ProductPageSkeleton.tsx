"use client";

import { ProductCardSkeleton } from "@/components/shop/ProductCardSkeleton";

function Sk({ className }: { className?: string }) {
  return <div className={className ? `sk ${className}` : "sk"} aria-hidden />;
}

function ProductGallerySkeleton() {
  return (
    <div className="product-gallery" aria-hidden>
      <div className="product-gallery-stage">
        <div className="product-gallery-main">
          <div className="product-media-actions shrink-0">
            <div className="product-media-actions-toolbar flex flex-col gap-2">
              <Sk className="h-9 w-9 rounded-full" />
              <Sk className="h-9 w-9 rounded-full" />
              <Sk className="h-9 w-9 rounded-full" />
            </div>
          </div>
          <Sk className="product-gallery-frame min-w-0 flex-1 rounded-heritage-lg" />
        </div>
        <div className="product-gallery-thumbs">
          {Array.from({ length: 4 }).map((_, index) => (
            <Sk key={index} className="product-gallery-thumb h-14 w-14 shrink-0 rounded-heritage md:h-[4.5rem] md:w-[4.5rem]" />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductBuyboxSkeleton() {
  return (
    <div className="product-detail-buybox">
      <div className="product-detail-buybox__section product-detail-buybox__price">
        <div className="product-detail-price">
          <div className="product-price-display product-price-display--stack w-full self-stretch">
            <div className="product-price-display-stack-wrap w-full">
              <Sk className="h-5 w-24 rounded-sm" />
              <Sk className="mt-2 h-8 w-36 rounded-sm" />
            </div>
          </div>
          <div className="product-detail-discount-row mt-3" dir="ltr">
            <Sk className="h-4 w-24 rounded-sm" />
            <Sk className="ms-auto h-[22px] w-9 rounded-full" />
          </div>
        </div>
        <Sk className="product-detail-sales-stat mt-3 h-3 w-40 rounded-sm" />
      </div>

      <div className="product-detail-buybox__section product-detail-buybox__actions">
        <div className="product-detail-actions">
          <Sk className="product-detail-actions-btn h-12 w-full rounded-heritage" />
        </div>
      </div>

      <div className="product-detail-buybox__section product-detail-buybox__customization">
        <div className="product-detail-buybox__customization-panel">
          <div className="grid gap-0.5">
            <Sk className="h-3 w-28 rounded-sm" />
            <Sk className="h-3 w-full rounded-sm" />
            <Sk className="h-3 w-4/5 rounded-sm" />
          </div>
          <Sk className="mt-2.5 h-9 w-full rounded-heritage" />
        </div>
      </div>

      <section className="product-detail-buybox__section product-detail-buybox__availability">
        <Sk className="product-detail-section-title mb-3 h-3 w-24 rounded-sm" />
        <div className="space-y-2.5">
          <Sk className="h-4 w-full rounded-sm" />
          <Sk className="h-4 w-11/12 rounded-sm" />
          <Sk className="h-4 w-4/5 rounded-sm" />
        </div>
      </section>
    </div>
  );
}

function ProductInsightPanelSkeleton() {
  return (
    <div className="product-detail-insight-panel rounded-heritage-lg border border-gold/10 bg-matte-elevated/60 p-4 md:p-5">
      <Sk className="h-4 w-32 rounded-sm" />
      <Sk className="mt-3 h-3 w-full rounded-sm" />
      <Sk className="mt-2 h-3 w-11/12 rounded-sm" />
      <Sk className="mt-2 h-3 w-4/5 rounded-sm" />
    </div>
  );
}

function ProductTrustCardsSkeleton() {
  return (
    <section className="product-detail-trust" aria-hidden>
      <header className="product-detail-trust__head">
        <Sk className="h-6 w-48 max-w-full rounded-sm md:h-7" />
        <Sk className="mt-2 h-3 w-64 max-w-full rounded-sm" />
      </header>
      <ul className="product-detail-trust__grid">
        {Array.from({ length: 3 }).map((_, index) => (
          <li key={index} className="product-detail-trust__card">
            <Sk className="product-detail-trust__icon h-11 w-11 rounded-full" />
            <div className="product-detail-trust__body">
              <Sk className="h-4 w-28 rounded-sm" />
              <Sk className="mt-2 h-3 w-full rounded-sm" />
              <Sk className="mt-1.5 h-3 w-4/5 rounded-sm" />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProductSectionNavSkeleton() {
  return (
    <nav className="product-section-nav product-detail-section-nav" aria-hidden>
      <ul className="product-section-nav-list">
        {Array.from({ length: 3 }).map((_, index) => (
          <li key={index}>
            <Sk className="h-9 w-24 shrink-0 rounded-full" />
          </li>
        ))}
      </ul>
    </nav>
  );
}

function ProductSpecsSkeleton() {
  return (
    <section className="product-detail-specs-content" aria-hidden>
      <div className="product-specs product-specs--grouped">
        <div className="product-specs__groups">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="product-specs__group">
              <Sk className="product-specs__group-title mb-2 h-4 w-24 rounded-sm" />
              <ul className="product-specs__list space-y-2">
                {Array.from({ length: 3 }).map((__, rowIndex) => (
                  <li key={rowIndex} className="flex items-center justify-between gap-3 px-1 py-1">
                    <Sk className="h-3 w-20 rounded-sm" />
                    <Sk className="h-3 w-24 rounded-sm" />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SalesTrustStripSkeleton() {
  return (
    <section className="sales-trust-strip sales-trust-strip--dense product-detail-trust" aria-hidden>
      <div className="site-container">
        <div className="sales-trust-strip-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="sales-trust-strip-item">
              <Sk className="sales-trust-strip-icon h-10 w-10 rounded-full" />
              <div className="sales-trust-strip-text">
                <Sk className="sales-trust-strip-title h-3.5 w-24 rounded-sm" />
                <Sk className="sales-trust-strip-hint mt-1.5 h-3 w-32 rounded-sm" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductCommentsSkeleton() {
  return (
    <section className="product-detail-comments" aria-hidden>
      <section className="product-reviews">
        <div className="product-reviews-section">
          <header className="product-reviews-section-header">
            <Sk className="product-reviews-title h-6 w-40 rounded-sm md:h-7" />
          </header>

          <div className="product-reviews-layout">
            <aside className="product-reviews-summary">
              <div className="product-reviews-summary-sticky">
                <Sk className="h-10 w-16 rounded-sm" />
                <Sk className="mt-2 h-4 w-24 rounded-sm" />
                <Sk className="mt-2 h-3 w-32 rounded-sm" />
                <Sk className="product-reviews-cta-btn mt-4 h-9 w-full rounded-heritage" />
              </div>
            </aside>

            <div className="product-reviews-main">
              <div className="product-reviews-body space-y-3">
                <div className="product-reviews-toolbar flex flex-wrap items-center justify-between gap-3">
                  <Sk className="h-4 w-28 rounded-sm" />
                  <Sk className="h-8 w-48 rounded-full" />
                </div>
                {Array.from({ length: 3 }).map((_, index) => (
                  <article key={index} className="product-comment-card">
                    <header className="product-comment-card-header">
                      <div className="product-comment-author">
                        <Sk className="product-comment-avatar h-9 w-9 rounded-full" />
                        <div className="min-w-0">
                          <Sk className="h-3.5 w-24 rounded-sm" />
                          <Sk className="mt-1.5 h-3 w-16 rounded-sm" />
                        </div>
                      </div>
                      <Sk className="h-4 w-20 rounded-sm" />
                    </header>
                    <Sk className="h-3 w-full rounded-sm" />
                    <Sk className="mt-2 h-3 w-11/12 rounded-sm" />
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}

function ProductQuestionsSkeleton() {
  return (
    <section id="product-section-questions" className="product-detail-questions" aria-hidden>
      <section className="product-questions">
        <div className="product-questions-section">
          <header className="product-questions-section-header">
            <Sk className="product-questions-title h-6 w-36 rounded-sm md:h-7" />
          </header>

          <div className="product-questions-layout">
            <aside className="product-questions-summary">
              <div className="product-questions-summary-sticky">
                <Sk className="h-3 w-full rounded-sm" />
                <Sk className="mt-3 h-9 w-full rounded-heritage" />
              </div>
            </aside>

            <div className="product-questions-main">
              <div className="product-questions-body space-y-3">
                <div className="product-questions-toolbar">
                  <Sk className="h-8 w-48 rounded-full" />
                  <Sk className="h-4 w-20 rounded-sm" />
                </div>
                {Array.from({ length: 2 }).map((_, index) => (
                  <article key={index} className="product-question-card">
                    <Sk className="h-4 w-full rounded-sm" />
                    <Sk className="mt-3 h-3 w-3/4 rounded-sm" />
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}

function ProductRecommendationsSkeleton() {
  return (
    <section className="product-smart-recommendations" aria-hidden>
      <div className="product-smart-recommendations__groups">
        {Array.from({ length: 2 }).map((_, groupIndex) => (
          <section key={groupIndex} className="product-smart-recommendations__group">
            <header className="product-smart-recommendations__group-head">
              <Sk className="product-smart-recommendations__group-title h-6 w-44 max-w-full rounded-sm" />
              <Sk className="product-smart-recommendations__group-subtitle mt-2 h-3 w-64 max-w-full rounded-sm" />
            </header>
            <div className="product-smart-recommendations__grid">
              {Array.from({ length: 5 }).map((__, cardIndex) => (
                <ProductCardSkeleton key={cardIndex} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

export function ProductPageSkeleton() {
  return (
    <div className="product-detail-page" aria-busy="true" aria-live="polite">
      <div className="site-container">
        <nav className="product-breadcrumb" aria-hidden>
          <div className="product-breadcrumb-list">
            <Sk className="h-3 w-12 rounded-sm" />
            <Sk className="h-3 w-3 rounded-sm" />
            <Sk className="h-3 w-20 rounded-sm" />
            <Sk className="h-3 w-3 rounded-sm" />
            <Sk className="h-3 w-32 max-w-[14rem] rounded-sm" />
          </div>
        </nav>

        <div className="product-detail-grid">
          <div className="product-detail-hero-row">
            <div className="product-detail-media">
              <ProductGallerySkeleton />
            </div>

            <div className="product-detail-info">
              <div className="product-detail-top-layout">
              <header className="product-detail-header product-detail-top-layout__intro">
                <Sk className="product-detail-title h-7 w-4/5 max-w-xl rounded-sm sm:h-8 md:h-8 lg:h-9" />
                <div className="product-detail-meta">
                  <Sk className="h-4 w-28 rounded-sm" />
                  <Sk className="h-4 w-24 rounded-sm" />
                </div>
                <Sk className="product-detail-piece-number mt-2 h-4 w-32 rounded-sm" />
                <div className="product-detail-description mt-4">
                  <ul className="product-content-brief-specs">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <li key={index} className="product-content-brief-spec">
                        <Sk className="h-3 w-12 rounded-sm" />
                        <Sk className="mt-1 h-3.5 w-full rounded-sm" />
                      </li>
                    ))}
                  </ul>
                </div>
              </header>

              <aside className="product-detail-side-panel product-detail-top-layout__commerce">
                <ProductBuyboxSkeleton />
                <div className="rounded-heritage-lg border border-gold/15 bg-matte-elevated/70 p-4 md:p-5">
                  <Sk className="h-4 w-36 rounded-sm" />
                  <Sk className="mt-3 h-3 w-full rounded-sm" />
                  <Sk className="mt-2 h-3 w-4/5 rounded-sm" />
                </div>
              </aside>

            </div>

            <div id="product-section-intro" />
            </div>
          </div>

          <div className="product-detail-insight-panels">
            {Array.from({ length: 3 }).map((_, index) => (
              <ProductInsightPanelSkeleton key={index} />
            ))}
          </div>

          <div className="product-detail-hero-meta">
            <ProductTrustCardsSkeleton />
          </div>
        </div>

        <ProductSectionNavSkeleton />
        <ProductSpecsSkeleton />
        <SalesTrustStripSkeleton />
        <ProductCommentsSkeleton />
        <ProductQuestionsSkeleton />
        <section className="product-detail-vendor-rail" aria-hidden>
          <Sk className="product-detail-related-title mb-4 h-6 w-56 max-w-full rounded-sm" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        </section>
        <ProductRecommendationsSkeleton />
      </div>
    </div>
  );
}
