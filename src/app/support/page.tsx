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
      <div className="pre-owned-sell-page min-h-screen pb-16 pt-24 md:pt-28">
        <div className="site-container max-w-xl">
          <header className="pre-owned-sell-header">
            <span className="heritage-eyebrow">{s.eyebrow}</span>
            <h1 className="pre-owned-sell-title">{s.title}</h1>
            <p className="pre-owned-sell-subtitle">{s.subtitle}</p>
          </header>
          <Suspense fallback={<div className="sk h-96 w-full rounded-heritage-lg" />}>
            <SupportRequestForm />
          </Suspense>
        </div>
      </div>
    </PageTransition>
  );
}
