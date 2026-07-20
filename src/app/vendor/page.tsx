"use client";

import Link from "next/link";
import { useApp } from "@/lib/context/AppContext";
import { VendorCard, VendorLinkButton, VendorPageHeader, useVendorProfile } from "@/components/vendor/VendorShell";
import { VendorStatusBadge } from "@/components/vendor/VendorStatusBadge";
import { LoadingState } from "@/components/ui/loading/LoadingState";
import { fa } from "@/lib/i18n/fa";

function GuideSteps() {
  const steps = [
    fa.vendor.hubGuideStep1,
    fa.vendor.hubGuideStep2,
    fa.vendor.hubGuideStep3,
    fa.vendor.hubGuideStep4,
  ];

  return (
    <VendorCard>
      <h2 className="font-semibold text-ivory">{fa.vendor.hubGuideTitle}</h2>
      <ol className="mt-4 space-y-2 text-sm text-silver">
        {steps.map((step, idx) => (
          <li key={step} className="flex items-start gap-2">
            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/15 text-xs font-semibold text-gold-dark">
              {(idx + 1).toLocaleString("fa-IR")}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </VendorCard>
  );
}

export default function VendorHomePage() {
  const { auth } = useApp();
  const { vendor, loading } = useVendorProfile();

  if (loading && auth.isLoggedIn) {
    return <LoadingState variant="vendor-hub" className="py-2" label={fa.vendor.loading} />;
  }

  if (!auth.isLoggedIn) {
    return (
      <section className="space-y-6 pb-12">
        <VendorPageHeader title={fa.vendor.hubTitle} />
        <p className="max-w-2xl text-silver">{fa.vendor.hubSubtitle}</p>

        <VendorCard>
          <h2 className="font-semibold text-ivory">{fa.vendor.hubNotLoggedInTitle}</h2>
          <p className="mt-2 text-sm text-silver">{fa.vendor.hubNotLoggedInHint}</p>
          <div className="mt-4">
            <VendorLinkButton href="/auth?redirect=%2Fvendor%2Fapply">{fa.vendor.hubLoginCta}</VendorLinkButton>
          </div>
        </VendorCard>

        <GuideSteps />
      </section>
    );
  }

  if (!vendor) {
    return (
      <section className="space-y-6 pb-12">
        <VendorPageHeader title={fa.vendor.hubTitle} />
        <p className="max-w-2xl text-silver">{fa.vendor.hubSubtitle}</p>

        <VendorCard>
          <h2 className="font-semibold text-ivory">{fa.vendor.hubApplyTitle}</h2>
          <p className="mt-2 text-sm text-silver">{fa.vendor.hubApplyHint}</p>
          <div className="mt-4">
            <VendorLinkButton href="/vendor/apply">{fa.vendor.hubApplyCta}</VendorLinkButton>
          </div>
        </VendorCard>

        <GuideSteps />
      </section>
    );
  }

  if (vendor.status === "pending_review") {
    return (
      <section className="space-y-6 pb-12">
        <VendorPageHeader title={fa.vendor.hubTitle} />
        <p className="max-w-2xl text-silver">{fa.vendor.hubSubtitle}</p>

        <VendorCard className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-ivory">{fa.vendor.hubPendingTitle}</h2>
            <p className="mt-2 text-sm text-silver">{fa.vendor.hubPendingHint}</p>
          </div>
          <VendorStatusBadge status={vendor.status} />
        </VendorCard>

        <VendorCard>
          <VendorLinkButton href="/vendor/dashboard">{fa.vendor.hubPendingCta}</VendorLinkButton>
        </VendorCard>
      </section>
    );
  }

  if (vendor.status === "rejected" || vendor.status === "draft") {
    return (
      <section className="space-y-6 pb-12">
        <VendorPageHeader title={fa.vendor.hubTitle} />
        <p className="max-w-2xl text-silver">{fa.vendor.hubSubtitle}</p>

        <VendorCard className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-ivory">{fa.vendor.hubRejectedTitle}</h2>
            <p className="mt-2 text-sm text-silver">{fa.vendor.hubRejectedHint}</p>
          </div>
          <VendorStatusBadge status={vendor.status} />
        </VendorCard>

        <VendorCard>
          <VendorLinkButton href="/vendor/dashboard">{fa.vendor.hubRejectedCta}</VendorLinkButton>
        </VendorCard>
      </section>
    );
  }

  return (
    <section className="space-y-6 pb-12">
      <VendorPageHeader title={fa.vendor.hubTitle} />
      <p className="max-w-2xl text-silver">{fa.vendor.hubSubtitle}</p>

      <VendorCard className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold text-ivory">{fa.vendor.hubActiveTitle}</h2>
          <p className="mt-2 text-sm text-silver">{fa.vendor.hubActiveHint}</p>
        </div>
        <VendorStatusBadge status={vendor.status} />
      </VendorCard>

      <VendorCard>
        <h3 className="font-semibold text-ivory">{fa.vendor.hubQuickActions}</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction href="/vendor/dashboard" label={fa.vendor.hubGoDashboard} />
          <QuickAction href="/vendor/products" label={fa.vendor.hubGoProducts} />
          <QuickAction href="/vendor/orders" label={fa.vendor.hubGoOrders} />
          <QuickAction href="/vendor/payouts" label={fa.vendor.hubGoPayouts} />
        </div>
      </VendorCard>
    </section>
  );
}

function QuickAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex h-11 items-center justify-center rounded-heritage border border-gold/20 bg-gold/5 px-4 text-sm font-medium text-gold-dark transition-colors hover:border-gold/35 hover:bg-gold/10"
    >
      {label}
    </Link>
  );
}
