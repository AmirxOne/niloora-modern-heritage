import type { Metadata } from "next";
import { InfoPageShell } from "@/components/legal/InfoPageShell";
import { LegalSections } from "@/components/legal/LegalSections";
import { fa } from "@/lib/i18n/fa";
import { buildPageMetadata } from "@/lib/seo/site";

const t = fa.legal.terms;

export const metadata: Metadata = buildPageMetadata({
  title: `${t.title} | ${fa.brand.name}`,
  description: t.metaDescription,
  path: "/terms",
});

export default function TermsPage() {
  return (
    <InfoPageShell eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle}>
      <LegalSections sections={t.sections} />
    </InfoPageShell>
  );
}
