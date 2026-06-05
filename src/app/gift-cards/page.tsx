import type { Metadata } from "next";
import { Suspense } from "react";
import { GiftCardsPageClient } from "@/components/gift-cards/GiftCardsPageClient";
import { fa } from "@/lib/i18n/fa";
import { buildPageMetadata } from "@/lib/seo/site";

export const metadata: Metadata = buildPageMetadata({
  title: `${fa.giftCards.pageTitle} | ${fa.brand.name}`,
  description: fa.giftCards.metaDescription,
  path: "/gift-cards",
});

export default function GiftCardsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-matte" aria-hidden />}>
      <GiftCardsPageClient />
    </Suspense>
  );
}
