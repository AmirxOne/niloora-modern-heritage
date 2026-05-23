import type { Metadata } from "next";
import { Suspense } from "react";
import { PageTransition } from "@/components/layout/PageTransition";
import { SupportRequestForm } from "@/components/support/SupportRequestForm";
import { fa } from "@/lib/i18n/fa";
import { buildPageMetadata } from "@/lib/seo/site";

const s = fa.supportRequest;

export const metadata: Metadata = buildPageMetadata({
  title: `${s.title} | ${fa.brand.name}`,
  description: s.metaDescription,
  path: "/support",
});

export default function SupportPage() {
  return (
    <PageTransition>
      <div className="support-page min-h-screen pb-24 pt-28 md:pt-32">
        <div className="site-container">
          <section className="support-page-shell">
            <header className="support-page-header">
              <span className="heritage-eyebrow">{s.eyebrow}</span>
              <h1 className="support-page-title">{s.title}</h1>
              <p className="support-page-subtitle">{s.subtitle}</p>
            </header>
            <div className="support-page-content">
              <Suspense fallback={<div className="sk h-96 w-full rounded-heritage-lg" />}>
                <SupportRequestForm />
              </Suspense>
            </div>
          </section>
        </div>
      </div>
    </PageTransition>
  );
}
