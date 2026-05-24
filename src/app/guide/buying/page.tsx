import type { Metadata } from "next";
import { InteractiveBuyingGuide } from "@/components/guide/InteractiveBuyingGuide";
import { buildPageMetadata } from "@/lib/seo/site";
import { fa } from "@/lib/i18n/fa";
import { buildBreadcrumbJsonLd } from "@/lib/seo/structured-data";

export const metadata: Metadata = buildPageMetadata({
  title: fa.guide.title,
  description: fa.guide.metaDescription,
  path: "/guide/buying",
});

export default function BuyingGuidePage() {
  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "خانه", path: "/" },
    { name: fa.guide.title, path: "/guide/buying" },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <div className="guide-page min-h-screen bg-matte pb-16 pt-24">
        <div className="site-container">
          <InteractiveBuyingGuide />
        </div>
      </div>
    </>
  );
}
