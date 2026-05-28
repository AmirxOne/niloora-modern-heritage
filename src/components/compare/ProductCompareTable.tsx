"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Product } from "@/lib/types";
import { getProductSpecEntries } from "@/components/product/ProductSpecs";
import { ProductPriceDisplay } from "@/components/product/ProductPriceDisplay";
import { ProductAvailabilityBadge } from "@/components/product/ProductAvailabilityBadge";
import { fa } from "@/lib/i18n/fa";
import { useApp } from "@/lib/context/AppContext";
import { Button } from "@/components/ui/Button";
import { TomanPrice } from "@/components/commerce/TomanPrice";
import { SelectBox, type SelectBoxOption } from "@/components/inputs";

type CompareRow = {
  key: string;
  values: string[];
};

type RecommendationNeed = "budget" | "fastDelivery" | "luxury" | "gifting";

function buildRows(products: Product[]): CompareRow[] {
  const specRows = products[0]
    ? getProductSpecEntries(products[0]).map((entry) => entry.key)
    : [];

  const uniqueKeys = Array.from(
    new Set([
      fa.compare.rowPrice,
      fa.compare.rowAvailability,
      fa.compare.rowCollection,
      ...specRows,
    ])
  );

  return uniqueKeys.map((key) => {
    if (key === fa.compare.rowPrice) {
      return {
        key,
        values: products.map((p) => String(p.price)),
      };
    }
    if (key === fa.compare.rowAvailability) {
      return {
        key,
        values: products.map((p) => p.availability),
      };
    }
    if (key === fa.compare.rowCollection) {
      return {
        key,
        values: products.map((p) => p.collection ?? "—"),
      };
    }
    return {
      key,
      values: products.map((p) => {
        const entry = getProductSpecEntries(p).find((e) => e.key === key);
        return entry?.value ?? "—";
      }),
    };
  });
}

function valueKeyForDiff(value: string): string {
  return value.trim().toLowerCase();
}

function isDifferentRow(row: CompareRow): boolean {
  const normalized = Array.from(new Set(row.values.map(valueKeyForDiff)));
  return normalized.length > 1;
}

function compareNeedScore(product: Product, need: RecommendationNeed): number {
  const availabilityScore =
    product.availability === "ready"
      ? 16
      : product.availability === "preorder"
        ? 7
        : product.availability === "made-to-order"
          ? 5
          : product.availability === "luxury"
            ? 3
            : 1;
  const luxuryScore = (product.featured ? 8 : 0) + (product.bestseller ? 5 : 0) + product.price / 20_000_000;
  const budgetScore = 220 - product.price / 1_000_000 + (product.discountPercent ?? 0) * 2;
  const giftingScore =
    (product.warrantyYears ?? 1) * 3 +
    (product.freeResize ? 4 : 0) +
    (product.occasions?.includes("gift") ? 6 : 0) +
    (product.occasions?.includes("anniversary") ? 3 : 0);

  switch (need) {
    case "budget":
      return budgetScore;
    case "fastDelivery":
      return availabilityScore * 5 - product.price / 35_000_000;
    case "luxury":
      return luxuryScore * 5;
    case "gifting":
    default:
      return giftingScore * 6 + availabilityScore * 2;
  }
}

function summarizeProduct(product: Product): { pros: string[]; cons: string[] } {
  const pros: string[] = [];
  const cons: string[] = [];

  if (product.availability === "ready") pros.push("ارسال سریع‌تر نسبت به سایر گزینه‌ها");
  if (product.discountPercent && product.discountPercent > 0) pros.push("دارای تخفیف فعال");
  if (product.featured) pros.push("گزینه ویژه گالری");
  if (product.bestseller) pros.push("پرفروش بین مشتریان");
  if ((product.warrantyYears ?? 0) > 1) pros.push("گارانتی بالاتر از حالت پایه");
  if (product.freeResize) pros.push("امکان تغییر سایز رایگان");
  if ((product.occasions ?? []).includes("gift")) pros.push("مناسب هدیه‌دادن");

  if (product.availability === "sold") cons.push("در حال حاضر فروش مستقیم ندارد");
  if (product.availability === "preorder" || product.availability === "made-to-order") {
    cons.push("زمان تحویل طولانی‌تر از حالت آماده");
  }
  if (product.price > 180_000_000) cons.push("در بازه قیمتی بالا");
  if (!product.discountPercent) cons.push("بدون تخفیف فعال");

  if (pros.length === 0) pros.push("کیفیت ساخت کارگاهی و متریال اصیل");
  if (cons.length === 0) cons.push("محدودیت شاخصی نسبت به گزینه‌های مقایسه‌ای ندارد");
  return { pros, cons };
}

export function ProductCompareTable({ products }: { products: Product[] }) {
  const { compareList } = useApp();
  const rows = buildRows(products);
  const [need, setNeed] = useState<RecommendationNeed>("budget");
  const needOptions: SelectBoxOption[] = [
    { value: "budget", label: fa.compare.recommendationNeedOptions.budget },
    { value: "fastDelivery", label: fa.compare.recommendationNeedOptions.fastDelivery },
    { value: "luxury", label: fa.compare.recommendationNeedOptions.luxury },
    { value: "gifting", label: fa.compare.recommendationNeedOptions.gifting },
  ];

  const recommended = useMemo(() => {
    const sorted = [...products].sort((a, b) => compareNeedScore(b, need) - compareNeedScore(a, need));
    return sorted[0] ?? null;
  }, [products, need]);

  return (
    <div className="compare-enhanced">
      <section className="compare-enhanced__recommendation">
        <h2 className="compare-enhanced__section-title">{fa.compare.recommendationTitle}</h2>
        <p className="compare-enhanced__hint">{fa.compare.recommendationNeedHint}</p>
        <div className="compare-enhanced__need-row">
          <div className="compare-enhanced__need-select">
            <SelectBox
              id="compare-need-select"
              label={fa.compare.recommendationNeedLabel}
              value={need}
              options={needOptions}
              onValueChange={(value) => setNeed(value as RecommendationNeed)}
            />
          </div>
        </div>
        {recommended ? (
          <div className="compare-enhanced__recommendation-result">
            <p>
              <strong>{fa.compare.recommendationResultLabel}:</strong> {recommended.namePersian || recommended.name}
            </p>
            <p>
              <strong>{fa.compare.recommendationReasonLabel}:</strong>{" "}
              {fa.compare.recommendationReasons[need]}
            </p>
          </div>
        ) : null}
      </section>

      <section className="compare-enhanced__summary">
        <h2 className="compare-enhanced__section-title">{fa.compare.summaryTitle}</h2>
        <div className="compare-enhanced__summary-grid">
          {products.map((product) => {
            const summary = summarizeProduct(product);
            return (
              <article key={product.id} className="compare-enhanced__summary-card">
                <h3 className="compare-enhanced__summary-title">{product.namePersian || product.name}</h3>
                <p className="compare-enhanced__summary-label">{fa.compare.prosTitle}</p>
                <ul className="compare-enhanced__list">
                  {summary.pros.map((item) => (
                    <li key={`pro-${product.id}-${item}`}>{item}</li>
                  ))}
                </ul>
                <p className="compare-enhanced__summary-label">{fa.compare.consTitle}</p>
                <ul className="compare-enhanced__list compare-enhanced__list--cons">
                  {summary.cons.map((item) => (
                    <li key={`con-${product.id}-${item}`}>{item}</li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </section>

      <section className="compare-enhanced__diff">
        <h2 className="compare-enhanced__section-title">{fa.compare.diffHighlightTitle}</h2>
        <p className="compare-enhanced__hint">{fa.compare.diffHighlightHint}</p>
        <div className="product-compare-table-wrap">
          <table className="product-compare-table">
            <thead>
              <tr>
                <th scope="col">{fa.compare.rowProduct}</th>
                {products.map((product) => (
                  <th key={product.id} scope="col" className="product-compare-table__product-col">
                    <div className="product-compare-table__product-head">
                      <Link href={`/product/${product.id}`} className="product-compare-table__thumb">
                        <Image
                          src={product.image}
                          alt={product.namePersian || product.name}
                          fill
                          sizes="160px"
                          className="object-cover"
                        />
                      </Link>
                      <Link href={`/product/${product.id}`} className="product-compare-table__name">
                        {product.namePersian || product.name}
                      </Link>
                      <ProductPriceDisplay product={product} size="sm" />
                      <div className="product-compare-table__actions">
                        <Link href={`/product/${product.id}`}>
                          <Button size="sm" variant="outline">
                            {fa.compare.viewProduct}
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => compareList.remove(product.id)}
                        >
                          {fa.compare.removeProduct}
                        </Button>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const different = isDifferentRow(row);
                return (
                  <tr key={row.key} className={different ? "product-compare-table__row--different" : undefined}>
                    <th scope="row">{row.key}</th>
                    {row.values.map((value, index) => (
                      <td key={`${row.key}-${products[index]?.id ?? index}`}>
                        {row.key === fa.compare.rowAvailability ? (
                          <ProductAvailabilityBadge
                            availability={products[index]!.availability}
                            short
                          />
                        ) : row.key === fa.compare.rowPrice ? (
                          <TomanPrice amount={products[index]!.price} size="xs" />
                        ) : (
                          value
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
