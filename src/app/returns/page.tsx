import type { Metadata } from "next";
import Link from "next/link";
import { InfoPageShell } from "@/components/legal/InfoPageShell";
import { LegalSections } from "@/components/legal/LegalSections";
import { fa } from "@/lib/i18n/fa";
import { buildPageMetadata } from "@/lib/seo/site";

const r = fa.legal.returns;

export const metadata: Metadata = buildPageMetadata({
  title: `${r.title} | ${fa.brand.name}`,
  description: r.metaDescription,
  path: "/returns",
});

export default function ReturnsPage() {
  return (
    <InfoPageShell eyebrow={r.eyebrow} title={r.title} subtitle={r.subtitle}>
      <LegalSections sections={r.sections} />
      <p className="info-page-footer-link flex flex-wrap gap-x-4 gap-y-2">
        <Link href="/support">{fa.footer.supportRequest}</Link>
        <Link href="/contact">{fa.footer.contact}</Link>
      </p>
    </InfoPageShell>
  );
}
