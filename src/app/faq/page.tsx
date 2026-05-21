import type { Metadata } from "next";
import Link from "next/link";
import { FaqAccordion } from "@/components/legal/FaqAccordion";
import { InfoPageShell } from "@/components/legal/InfoPageShell";
import { fa } from "@/lib/i18n/fa";
import { buildPageMetadata } from "@/lib/seo/site";

const f = fa.legal.faq;

export const metadata: Metadata = buildPageMetadata({
  title: `${f.title} | ${fa.brand.name}`,
  description: f.metaDescription,
  path: "/faq",
});

export default function FaqPage() {
  return (
    <InfoPageShell eyebrow={f.eyebrow} title={f.title} subtitle={f.subtitle}>
      <FaqAccordion items={f.items} />
      <p className="info-page-footer-link">
        <Link href="/contact">{fa.footer.contact}</Link>
      </p>
    </InfoPageShell>
  );
}
