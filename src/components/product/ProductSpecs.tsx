import type { Product } from "@/lib/types";
import Link from "next/link";
import { fa } from "@/lib/i18n/fa";
import { cn } from "@/lib/utils";
import {
  getProductSpecGroups,
  getProductSpecEntriesFlat,
  type SpecEntry,
} from "@/lib/products/product-specs";

/**
 * فلت‌شده برای استفاده در صفحات قدیمی (مانند جدول مقایسه).
 * منبع حقیقت: getProductSpecEntriesFlat
 */
export function getProductSpecEntries(product: Product): SpecEntry[] {
  return getProductSpecEntriesFlat(product);
}

interface ProductSpecsProps {
  product: Product;
  className?: string;
  /** وقتی پر باشد، عنوانی داخل بلوک نمایش داده می‌شود (مثلاً در quick view). */
  title?: string;
  /** حالت فشرده — فقط یک لیست تخت بدون گروه‌بندی (برای quick view). */
  compact?: boolean;
}

export function ProductSpecs({ product, className, title, compact }: ProductSpecsProps) {
  const groups = getProductSpecGroups(product);
  const ariaLabel = title ?? fa.product.featuresTitle;

  if (compact) {
    const entries = getProductSpecEntriesFlat(product);
    return (
      <section className={cn("product-specs", className)} aria-label={ariaLabel}>
        {title ? <h3 className="product-specs__title">{title}</h3> : null}
        <ul className="product-specs__list">
          {entries.map(({ key, value, href }) => (
            <li key={`${key}-${value}`}>
              <span className="product-specs__key">{key}</span>
              <span className="product-specs__val">
                {href ? (
                  <Link href={href} className="product-specs__val-link">
                    {value}
                  </Link>
                ) : (
                  value
                )}
              </span>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section
      className={cn("product-specs product-specs--grouped", className)}
      aria-label={ariaLabel}
    >
      {title ? <h3 className="product-specs__title">{title}</h3> : null}
      <div className="product-specs__groups">
        {groups.map((group) => (
          <div key={group.id} className="product-specs__group">
            <h4 className="product-specs__group-title">{group.title}</h4>
            <ul className="product-specs__list">
              {group.entries.map(({ key, value, href }) => (
                <li key={`${group.id}-${key}`}>
                  <span className="product-specs__key">{key}</span>
                  <span className="product-specs__val">
                    {href ? (
                      <Link href={href} className="product-specs__val-link">
                        {value}
                      </Link>
                    ) : (
                      value
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
