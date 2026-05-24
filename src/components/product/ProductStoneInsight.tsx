"use client";

import Link from "next/link";
import type { Product } from "@/lib/types";
import { getStoneGuideById } from "@/lib/stones";

interface ProductStoneInsightProps {
  product: Product;
  className?: string;
}

export function ProductStoneInsight({ product, className }: ProductStoneInsightProps) {
  const guide = getStoneGuideById(product.stone);
  if (!guide) return null;

  return (
    <section className={`product-stone-insight ${className ?? ""}`.trim()} aria-labelledby="product-stone-insight-title">
      <header className="product-stone-insight__head">
        <h2 id="product-stone-insight-title" className="product-stone-insight__title">
          <Link href={`/stones/${guide.slug}`} className="product-stone-insight__link">
            شناخت سنگ {guide.name}
          </Link>
        </h2>
        <p className="product-stone-insight__subtitle">{guide.shortTagline}</p>
      </header>

      <div className="product-stone-insight__grid">
        <div>
          <h3 className="product-stone-insight__h3">مناسب چه افرادی است؟</h3>
          <ul className="product-stone-insight__list">
            {guide.recommendedFor.slice(0, 3).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="product-stone-insight__h3">اثر روان‌شناختی رایج</h3>
          <ul className="product-stone-insight__list">
            {guide.psychologicalEffects.slice(0, 2).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <footer className="product-stone-insight__footer">
        <Link href={`/stones/${guide.slug}`} className="product-stone-insight__link">
          مطالعه کامل تاریخچه و خواص سنگ
        </Link>
      </footer>
    </section>
  );
}

