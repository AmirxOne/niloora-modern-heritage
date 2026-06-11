import type { Metadata } from "next";
import Link from "next/link";
import { InfoPageShell } from "@/components/legal/InfoPageShell";
import { Button } from "@/components/ui/Button";
import { fa } from "@/lib/i18n/fa";
import { buildPageMetadata } from "@/lib/seo/site";
import { buildLocalBusinessJsonLd } from "@/lib/seo/structured-data";
import { getPublicSiteSettings } from "@/lib/server/site-settings/site-settings";

const c = fa.legal.contact;

export const metadata: Metadata = buildPageMetadata({
  // Brand name is appended by the root title template — keep this bare.
  title: c.title,
  description: c.metaDescription,
  path: "/contact",
});

export default async function ContactPage() {
  const settings = await getPublicSiteSettings();
  const localBusinessJsonLd = buildLocalBusinessJsonLd({
    brandName: settings.brandName,
    logoUrl: settings.logoUrl,
    telephone: settings.contactPhone ?? c.phone,
    address: c.address,
    openingHours: c.hours,
  });
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />
    <InfoPageShell
      eyebrow={c.eyebrow}
      title={c.title}
      subtitle={c.subtitle}
      breadcrumb={[
        { label: fa.nav.home, href: "/" },
        { label: c.title },
      ]}
    >
      <section className="info-contact-cards">
        <h2 className="info-section-title">{c.channelsTitle}</h2>
        <ul className="info-contact-list">
          <li>
            <span className="info-contact-label">{c.phoneLabel}</span>
            <a href={c.phoneHref} className="info-contact-value" dir="ltr">
              {c.phone}
            </a>
          </li>
          <li>
            <span className="info-contact-label">{c.emailLabel}</span>
            <a href={c.emailHref} className="info-contact-value" dir="ltr">
              {c.email}
            </a>
          </li>
          <li>
            <span className="info-contact-label">{c.hoursTitle}</span>
            <span className="info-contact-value">{c.hours}</span>
          </li>
          <li>
            <span className="info-contact-label">{c.addressTitle}</span>
            <span className="info-contact-value">{c.address}</span>
          </li>
        </ul>
        <p className="info-section-p mt-6">{c.note}</p>
        <div className="info-contact-actions">
          <Link href="/shop">
            <Button variant="turquoise">{c.ctaShop}</Button>
          </Link>
          <Link href="/customize">
            <Button variant="outline">{c.ctaCustomize}</Button>
          </Link>
        </div>
      </section>
    </InfoPageShell>
    </>
  );
}
