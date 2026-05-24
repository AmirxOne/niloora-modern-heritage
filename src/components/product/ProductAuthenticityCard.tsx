"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import { fa } from "@/lib/i18n/fa";
import { absoluteUrl } from "@/lib/seo/site";
import { resolvePieceCode } from "@/lib/products/piece-code";
import type { Product } from "@/lib/types";

export function ProductAuthenticityCard({ product }: { product: Product }) {
  const pieceCode = resolvePieceCode(product);
  const verifyUrl = useMemo(
    () => absoluteUrl(`/verify?pieceCode=${encodeURIComponent(pieceCode)}`),
    [pieceCode]
  );
  const qrUrl = useMemo(
    () =>
      `https://api.qrserver.com/v1/create-qr-code/?size=220x220&format=png&data=${encodeURIComponent(verifyUrl)}`,
    [verifyUrl]
  );

  return (
    <section className="product-detail-side-section product-authenticity-card" aria-labelledby="product-auth-title">
      <h2 id="product-auth-title" className="product-detail-section-title">
        {fa.product.authenticity.title}
      </h2>
      <p className="product-authenticity-subtitle">{fa.product.authenticity.subtitle}</p>

      <div className="product-authenticity-piece" dir="ltr">
        {pieceCode}
      </div>

      <div className="product-authenticity-qr-wrap">
        {/* QR تصویر آماده برای اسکن موبایل؛ داده فقط لینک verify عمومی است. */}
        <Image
          src={qrUrl}
          alt={fa.product.authenticity.qrHint}
          className="product-authenticity-qr"
          width={112}
          height={112}
          unoptimized
        />
      </div>

      <p className="product-authenticity-hint">{fa.product.authenticity.qrHint}</p>
      <Link href={`/verify?pieceCode=${encodeURIComponent(pieceCode)}`} className="product-authenticity-link">
        {fa.product.authenticity.verifyNow}
      </Link>
    </section>
  );
}
