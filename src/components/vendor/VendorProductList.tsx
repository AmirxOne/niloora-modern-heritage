"use client";

import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { PublicationStatusBadge } from "@/components/vendor/PublicationStatusBadge";
import {
  canVendorEditPublication,
  canVendorSubmitPublication,
} from "@/lib/vendor/labels";
import { fa } from "@/lib/i18n/fa";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/lib/types";
import type { AdminProductDto } from "@/lib/server/products/admin-product-dto";
import { DEFAULT_PRODUCT_IMAGE } from "@/lib/images";

type VendorProductRow = Product & Pick<AdminProductDto, "updatedAt">;

type Props = {
  products: VendorProductRow[];
  vendorActive: boolean;
  onEdit: (product: Product) => void;
  onRefresh: () => void;
};

export function VendorProductList({ products, vendorActive, onEdit, onRefresh }: Props) {
  const submitForReview = async (productId: string) => {
    const res = await fetch(`/api/vendor/products/${productId}/submit`, {
      method: "POST",
      credentials: "include",
    });
    if (res.ok) onRefresh();
  };

  if (products.length === 0) {
    return <p className="text-silver">{fa.vendor.productsEmpty}</p>;
  }

  return (
    <ul className="space-y-3">
      {products.map((product) => {
        const editable = canVendorEditPublication(product.publicationStatus);
        const submittable = canVendorSubmitPublication(product.publicationStatus);
        return (
          <li
            key={product.id}
            className="flex flex-col gap-4 rounded-heritage border border-subtle bg-white p-4 sm:flex-row sm:items-center"
          >
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-heritage bg-matte">
              <Image
                src={product.image || DEFAULT_PRODUCT_IMAGE}
                alt={product.namePersian}
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="font-medium text-ivory">{product.namePersian}</div>
              <div className="text-sm text-silver">{formatPrice(product.price)}</div>
              {product.updatedAt ? (
                <div className="text-xs text-silver">
                  {fa.vendor.productUpdatedAt}:{" "}
                  {new Date(product.updatedAt).toLocaleDateString("fa-IR")}
                </div>
              ) : null}
              <PublicationStatusBadge status={product.publicationStatus} />
            </div>
            <div className="flex flex-wrap gap-2">
              {editable ? (
                <Button type="button" size="sm" variant="outline" onClick={() => onEdit(product)}>
                  {fa.vendor.productsEdit}
                </Button>
              ) : null}
              {submittable && vendorActive ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => submitForReview(product.id)}
                >
                  {fa.vendor.productsSubmit}
                </Button>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
