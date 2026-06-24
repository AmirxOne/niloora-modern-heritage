"use client";

import Link from "next/link";
import { MessageCircle, Refresh2, Verify } from "@/components/icons";
import { fa } from "@/lib/i18n/fa";
import { ICON_VARIANT, iconSizes } from "@/lib/icons";
import { cn } from "@/lib/utils";

const trustItems = [
  {
    id: "authenticity",
    title: fa.product.trustCards.authenticityTitle,
    body: fa.product.trustCards.authenticityBody,
    Icon: Verify,
  },
  {
    id: "returns",
    title: fa.product.trustCards.returnsTitle,
    body: fa.product.trustCards.returnsBody,
    link: { href: "/returns", label: fa.product.trustCards.returnsLink },
    Icon: Refresh2,
  },
  {
    id: "support",
    title: fa.product.trustCards.supportTitle,
    body: fa.product.trustCards.supportBody,
    link: { href: "/contact", label: fa.product.trustCards.supportLink },
    Icon: MessageCircle,
  },
] as const;

type ProductDetailTrustCardsProps = {
  className?: string;
};

export function ProductDetailTrustCards({ className }: ProductDetailTrustCardsProps) {
  return (
    <section
      className={cn("product-detail-trust", className)}
      aria-labelledby="product-trust-title"
    >
      <header className="product-detail-trust__head">
        <h2 id="product-trust-title" className="product-detail-trust__title">
          {fa.product.trustCards.title}
        </h2>
        <p className="product-detail-trust__subtitle">{fa.product.trustCards.subtitle}</p>
      </header>

      <ul className="product-detail-trust__grid">
        {trustItems.map((item) => (
          <li key={item.id} className="product-detail-trust__card">
            <span className="product-detail-trust__icon" aria-hidden>
              <item.Icon size={iconSizes.md} variant={ICON_VARIANT} />
            </span>
            <div className="product-detail-trust__body">
              <h3 className="product-detail-trust__card-title">{item.title}</h3>
              <p className="product-detail-trust__card-text">
                {item.body}
                {"link" in item && item.link ? (
                  <>
                    {" "}
                    <Link href={item.link.href} className="product-detail-trust__link">
                      {item.link.label}
                    </Link>
                    .
                  </>
                ) : null}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
