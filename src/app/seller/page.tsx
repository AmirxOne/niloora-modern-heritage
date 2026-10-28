import type { Metadata } from "next";
import { PageTransition } from "@/components/layout/PageTransition";
import { SiteContainer } from "@/components/layout/SiteContainer";
import { SellerPanel } from "@/components/seller/SellerPanel";
import { fa } from "@/lib/i18n/fa";

export const metadata: Metadata = {
  title: `${fa.sellerPanel.title} | ${fa.brand.name}`,
  description: fa.sellerPanel.registerSubtitle,
  robots: { index: false, follow: false },
};

export default function SellerPage() {
  return (
    <PageTransition>
      <SiteContainer>
        <div className="pb-24 pt-8 md:pt-12">
          <SellerPanel />
        </div>
      </SiteContainer>
    </PageTransition>
  );
}
