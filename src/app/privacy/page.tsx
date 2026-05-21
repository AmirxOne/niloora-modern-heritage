import type { Metadata } from "next";
import { InfoPageShell } from "@/components/legal/InfoPageShell";
import { LegalSections } from "@/components/legal/LegalSections";
import { fa } from "@/lib/i18n/fa";
import { buildPageMetadata } from "@/lib/seo/site";

const p = fa.legal.privacy;

export const metadata: Metadata = buildPageMetadata({
  title: `${p.title} | ${fa.brand.name}`,
  description: p.metaDescription,
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <InfoPageShell eyebrow={p.eyebrow} title={p.title} subtitle={p.subtitle}>
      <LegalSections sections={p.sections} />
    </InfoPageShell>
  );
}
