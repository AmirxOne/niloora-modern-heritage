import type { Metadata } from "next";
import { Suspense } from "react";
import { PageTransition } from "@/components/layout/PageTransition";
import { PageHeader } from "@/components/ui/PageHeader";
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
      <div className="support-page min-h-screen pb-24 pt-20 md:pt-24">
        <div className="site-container">
          <section className="support-page-shell">
            <PageHeader
              eyebrow={s.eyebrow}
              title={s.title}
              subtitle={s.subtitle}
              className="support-page-header"
            />
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
