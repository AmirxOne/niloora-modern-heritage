import { Fragment } from "react";
import Link from "next/link";
import { fa } from "@/lib/i18n/fa";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

/**
 * Shared breadcrumb trail. Reuses the existing `product-breadcrumb*` styles so
 * it looks identical to the product page breadcrumb across the site. The last
 * item is always rendered as the current page.
 */
export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  if (items.length === 0) return null;
  return (
    <nav className="product-breadcrumb" aria-label={fa.product.breadcrumbAria}>
      <ol className="product-breadcrumb-list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <Fragment key={`${item.label}-${index}`}>
              <li>
                {item.href && !isLast ? (
                  <Link href={item.href} className="product-breadcrumb-link">
                    {item.label}
                  </Link>
                ) : (
                  <span className="product-breadcrumb-current" aria-current="page">
                    {item.label}
                  </span>
                )}
              </li>
              {!isLast ? (
                <li className="product-breadcrumb-sep" aria-hidden>
                  /
                </li>
              ) : null}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
