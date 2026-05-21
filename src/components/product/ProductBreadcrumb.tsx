import Link from "next/link";
import { fa } from "@/lib/i18n/fa";

interface ProductBreadcrumbProps {
  productName: string;
}

export function ProductBreadcrumb({ productName }: ProductBreadcrumbProps) {
  return (
    <nav className="product-breadcrumb" aria-label={fa.product.breadcrumbAria}>
      <ol className="product-breadcrumb-list">
        <li>
          <Link href="/" className="product-breadcrumb-link">
            {fa.nav.home}
          </Link>
        </li>
        <li className="product-breadcrumb-sep" aria-hidden>
          /
        </li>
        <li>
          <Link href="/shop" className="product-breadcrumb-link">
            {fa.nav.shop}
          </Link>
        </li>
        <li className="product-breadcrumb-sep" aria-hidden>
          /
        </li>
        <li className="product-breadcrumb-current" aria-current="page">
          {productName}
        </li>
      </ol>
    </nav>
  );
}
