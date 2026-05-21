"use client";

import { Suspense } from "react";
import { CartPageContent } from "@/components/cart/CartPageContent";
import { PageTransition } from "@/components/layout/PageTransition";

export default function CartPage() {
  return (
    <PageTransition>
      <div className="pb-24 pt-6 md:pt-8">
        <div className="site-container">
          <Suspense fallback={null}>
            <CartPageContent />
          </Suspense>
        </div>
      </div>
    </PageTransition>
  );
}
