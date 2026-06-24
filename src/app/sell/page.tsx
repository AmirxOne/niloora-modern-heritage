import type { Metadata } from "next";
import Link from "next/link";
import { PageTransition } from "@/components/layout/PageTransition";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { fa } from "@/lib/i18n/fa";
import { buildPageMetadata } from "@/lib/seo/site";
import { buildOrganizationJsonLd, buildWebPageJsonLd } from "@/lib/seo/structured-data";
import { getPublicSiteSettings } from "@/lib/server/site-settings/site-settings";

const v = fa.vendor;

export const metadata: Metadata = buildPageMetadata({
  title: v.sellTitle,
  description: v.sellSubtitle,
  path: "/sell",
});

export default async function SellPage() {
  const settings = await getPublicSiteSettings();
  const organizationJsonLd = buildOrganizationJsonLd({
    brandName: settings.brandName,
    logoUrl: settings.logoUrl,
    social: settings.social,
    contactPhone: settings.contactPhone,
  });
  const webPageJsonLd = buildWebPageJsonLd({
    name: v.sellTitle,
    description: v.sellSubtitle,
    path: "/sell",
    brandName: settings.brandName,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([organizationJsonLd, webPageJsonLd]) }}
      />
      <PageTransition>
        <div className="sell-page pt-6 md:pt-8">
          <section className="site-container pb-16 pt-8 md:pb-24">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs tracking-widest text-turquoise">{v.sellEyebrow}</p>
              <h1 className="mt-4 font-display text-4xl text-ivory md:text-5xl">{v.sellTitle}</h1>
              <p className="mt-6 text-lg leading-relaxed text-silver">{v.sellSubtitle}</p>
              <div className="mt-8">
                <Link href="/vendor/apply">
                  <Button size="lg">{v.sellCta}</Button>
                </Link>
              </div>
            </div>

            <div className="mt-20">
              <SectionHeading title={v.sellBenefitsTitle} />
              <div className="mt-8 grid gap-6 md:grid-cols-3">
                {v.sellBenefits.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-heritage border border-subtle bg-matte-elevated p-6"
                  >
                    <h3 className="font-display text-xl text-ivory">{item.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-silver">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-16 grid gap-10 lg:grid-cols-2">
              <div className="rounded-heritage border border-subtle bg-white p-6">
                <h2 className="font-display text-2xl text-ivory">{v.sellRequirementsTitle}</h2>
                <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-silver">
                  {v.sellRequirements.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-heritage border border-subtle bg-white p-6">
                <h2 className="font-display text-2xl text-ivory">{v.sellFaqTitle}</h2>
                <dl className="mt-4 space-y-4">
                  {v.sellFaq.map((item) => (
                    <div key={item.q}>
                      <dt className="font-medium text-ivory">{item.q}</dt>
                      <dd className="mt-1 text-sm text-silver">{item.a}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </section>
        </div>
      </PageTransition>
    </>
  );
}
