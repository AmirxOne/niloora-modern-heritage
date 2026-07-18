"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { getProductSpecEntries } from "@/components/product/ProductSpecs";
import { ProductPriceDisplay } from "@/components/product/ProductPriceDisplay";
import { ProductAvailabilityBadge } from "@/components/product/ProductAvailabilityBadge";
import { getProductDisplayName } from "@/lib/products/product-display-name";
import { fa } from "@/lib/i18n/fa";
import { useApp } from "@/lib/context/AppContext";
import { Button } from "@/components/ui/Button";
import { TomanPrice } from "@/components/commerce/TomanPrice";
import { Trash2 } from "@/components/icons";
import { ICON_VARIANT, iconSizes } from "@/lib/icons";

type CompareRow = {
  key: string;
  values: string[];
};

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

export function ProductCompareTable({ products }: { products: Product[] }) {
  const { compareList } = useApp();
  const rows = buildRows(products);

  return (
    <section className="compare-enhanced__diff">
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
                        alt={getProductDisplayName(product)}
                        fill
                        sizes="256px"
                        className="object-cover"
                      />
                    </Link>
                    <Link href={`/product/${product.id}`} className="product-compare-table__name">
                      {getProductDisplayName(product)}
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
                        aria-label={fa.compare.removeProduct}
                        title={fa.compare.removeProduct}
                      >
                        <Trash2 size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />
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
  );
}
