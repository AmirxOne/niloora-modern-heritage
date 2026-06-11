import type { Metadata } from "next";
import Link from "next/link";
import { FaqAccordion } from "@/components/legal/FaqAccordion";
import { InfoPageShell } from "@/components/legal/InfoPageShell";
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
      <InfoPageShell
        eyebrow={f.eyebrow}
        title={f.title}
        subtitle={f.subtitle}
        breadcrumb={[
          { label: fa.nav.home, href: "/" },
          { label: f.title },
        ]}
      >
        <FaqAccordion items={f.items} />
        <p className="info-page-footer-link">
          <Link href="/contact">{fa.footer.contact}</Link>
        </p>
      </InfoPageShell>
    </>
  );
}
