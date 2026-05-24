import type { Metadata } from "next";
import Link from "next/link";
import { InfoPageShell } from "@/components/legal/InfoPageShell";
import { Button } from "@/components/ui/Button";
import { fa } from "@/lib/i18n/fa";
import { buildPageMetadata } from "@/lib/seo/site";

const w = fa.legal.workshopTransparency;

export const metadata: Metadata = buildPageMetadata({
  title: `${w.title} | ${fa.brand.name}`,
  description: w.metaDescription,
  path: "/workshop-transparency",
});

export default function WorkshopTransparencyPage() {
  return (
    <InfoPageShell eyebrow={w.eyebrow} title={w.title} subtitle={w.subtitle}>
      <section className="info-sections">
        <section className="info-section">
          <h2 className="info-section-title">{w.processTitle}</h2>
          <div className="mt-4 space-y-3">
            {w.processItems.map((item) => (
              <article key={item.title} className="info-subsection-card">
                <h3 className="info-subsection-title">{item.title}</h3>
                <p className="info-section-p">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="info-section">
          <h2 className="info-section-title">{w.qcTitle}</h2>
          <ul className="info-section-list">
            {w.qcItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="info-section">
          <h2 className="info-section-title">{w.guaranteesTitle}</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {w.guaranteesItems.map((item) => (
              <article key={item.title} className="info-subsection-card h-full">
                <h3 className="info-subsection-title">{item.title}</h3>
                <p className="info-section-p">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="info-section">
          <h2 className="info-section-title">{w.timelineTitle}</h2>
          <ul className="workshop-timeline-grid">
            {w.timelineItems.map((item) => (
              <li key={item.label} className="workshop-timeline-card">
                <span className="workshop-timeline-label">{item.label}</span>
                <strong className="workshop-timeline-value">{item.value}</strong>
              </li>
            ))}
          </ul>
          <p className="info-section-p">{w.timelineNote}</p>
        </section>
      </section>

      <div className="info-contact-actions justify-center">
        <Link href="/support">
          <Button variant="turquoise">{w.ctaSupport}</Button>
        </Link>
        <Link href="/returns">
          <Button variant="outline">{w.ctaReturns}</Button>
        </Link>
      </div>
    </InfoPageShell>
  );
}
