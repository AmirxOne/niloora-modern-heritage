"use client";

import type { BundleOfferDefinition, Product } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { fa } from "@/lib/i18n/fa";

interface ProductBundleOffersPanelProps {
  product: Product;
  bundles: BundleOfferDefinition[];
  onAddBundleToCart: (bundle: BundleOfferDefinition) => void;
}

export function ProductBundleOffersPanel({
  product,
  bundles,
  onAddBundleToCart,
}: ProductBundleOffersPanelProps) {
  if (bundles.length === 0) return null;

  return (
    <section className="product-bundle-offers">
      <h3 className="product-bundle-offers__title">{fa.product.bundleOffers.title}</h3>
      <p className="product-bundle-offers__subtitle">{fa.product.bundleOffers.subtitle}</p>
      <ul className="product-bundle-offers__list">
        {bundles.map((bundle) => {
          const othersCount = bundle.requiredProductIds.filter((id) => id !== product.id).length;
          return (
            <li key={bundle.id} className="product-bundle-offers__item">
              <div className="product-bundle-offers__content">
                <p className="product-bundle-offers__item-title">{bundle.title}</p>
                {bundle.description ? (
                  <p className="product-bundle-offers__item-desc">{bundle.description}</p>
                ) : null}
                <p className="product-bundle-offers__item-meta">
                  {bundle.discountType === "percent"
                    ? fa.product.bundleOffers.percentOff(bundle.discountValue)
                    : fa.product.bundleOffers.fixedOff(bundle.discountValue)}
                  {" · "}
                  {fa.product.bundleOffers.otherItemsCount(othersCount)}
                </p>
              </div>
              <Button type="button" variant="outline" onClick={() => onAddBundleToCart(bundle)}>
                {fa.product.bundleOffers.addBundle}
              </Button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
