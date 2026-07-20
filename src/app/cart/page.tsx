"use client";

import { Suspense } from "react";
import { CartPageContent } from "@/components/cart/CartPageContent";
import { PageTransition } from "@/components/layout/PageTransition";
import { LoadingState } from "@/components/ui/loading/LoadingState";

export default function CartPage() {
  return (
    <PageTransition>
      <div className="pb-24 pt-6 md:pt-8">
        <div className="site-container">
          <Suspense
            fallback={<LoadingState variant="inline" className="py-6" label="در حال بارگذاری سبد خرید..." />}
          >
            <CartPageContent />
          </Suspense>
        </div>
      </div>
    </PageTransition>
  );
}
