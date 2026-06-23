import type { Metadata } from "next";
import { FaqPageContent } from "@/components/legal/FaqPageContent";
import { PageTransition } from "@/components/layout/PageTransition";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { fa } from "@/lib/i18n/fa";
import { buildPageMetadata } from "@/lib/seo/site";
import { buildBreadcrumbJsonLd, buildFaqJsonLd } from "@/lib/seo/structured-data";

const f = fa.legal.faq;

export const metadata: Metadata = buildPageMetadata({
  // Brand name is appended by the root title template — keep this bare.
  title: f.title,
  description: f.metaDescription,
  path: "/faq",
});

export default function FaqPage() {
  const faqJsonLd = buildFaqJsonLd(
    f.items.map((item) => ({ question: item.question, answer: item.answer }))
  );
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "خانه", path: "/" },
    { name: f.title, path: "/faq" },
  ]);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([faqJsonLd, breadcrumbJsonLd]) }}
      />
      <PageTransition>
        <div className="faq-page">
          <div className="site-container">
            <div className="faq-page-shell">
              <Breadcrumb
                items={[
                  { label: fa.nav.home, href: "/" },
                  { label: f.title },
                ]}
              />
              <FaqPageContent
                heroTitle={f.heroTitle}
                heroSubtitle={f.heroSubtitle}
                searchLabel={f.searchLabel}
                searchPlaceholder={f.searchPlaceholder}
                sidebarLabel={f.sidebarLabel}
                contactPrompt={f.contactPrompt}
                contactEyebrow={f.contactEyebrow}
                contactSubtitle={f.contactSubtitle}
                noResults={f.noResults}
                contactLabel={fa.footer.contact}
                supportLabel={fa.footer.supportRequest}
                categories={f.categories}
                items={f.items}
              />
            </div>
          </div>
        </div>
      </PageTransition>
    </>
  );
}
