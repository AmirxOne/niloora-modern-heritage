"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  VendorProductForm,
  productToFormValues,
} from "@/components/vendor/VendorProductForm";
import { VendorProductList } from "@/components/vendor/VendorProductList";
import { VendorCard, VendorPageHeader, useVendorProfile } from "@/components/vendor/VendorShell";
import { fa } from "@/lib/i18n/fa";
import type { Product } from "@/lib/types";

type Panel = "list" | "create" | "edit";

export default function VendorProductsPage() {
  const { vendor, loading: profileLoading } = useVendorProfile();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [panel, setPanel] = useState<Panel>("list");
  const [editing, setEditing] = useState<Product | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vendor/products", { credentials: "include" });
      const data = await res.json();
      setProducts(data.products ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (vendor?.status === "active") loadProducts();
    else setLoading(false);
  }, [vendor, loadProducts]);

  if (profileLoading || loading) return <p className="text-silver">{fa.vendor.loading}</p>;

  if (!vendor) {
    return (
      <section>
        <VendorPageHeader title={fa.vendor.productsTitle} />
        <VendorCard>
          <p className="text-silver">{fa.vendor.dashboardNoVendor}</p>
        </VendorCard>
      </section>
    );
  }

  if (vendor.status !== "active") {
    return (
      <section>
        <VendorPageHeader title={fa.vendor.productsTitle} />
        <VendorCard>
          <p className="text-silver">{fa.vendor.vendorInactive}</p>
        </VendorCard>
      </section>
    );
  }

  const onSaved = () => {
    setPanel("list");
    setEditing(null);
    loadProducts();
  };

  return (
    <section className="space-y-6 pb-12">
      <VendorPageHeader
        title={fa.vendor.productsTitle}
        action={
          panel === "list" ? (
            <Button type="button" onClick={() => setPanel("create")}>
              {fa.vendor.productsNew}
            </Button>
          ) : null
        }
      />

      {panel === "create" ? (
        <VendorProductForm mode="create" onCancel={() => setPanel("list")} onSaved={onSaved} />
      ) : null}

      {panel === "edit" && editing ? (
        <VendorProductForm
          mode="edit"
          productId={editing.id}
          initial={productToFormValues(editing)}
          onCancel={() => {
            setPanel("list");
            setEditing(null);
          }}
          onSaved={onSaved}
        />
      ) : null}

      {panel === "list" ? (
        <VendorProductList
          products={products}
          vendorActive={vendor.status === "active"}
          onEdit={(product) => {
            setEditing(product);
            setPanel("edit");
          }}
          onRefresh={loadProducts}
        />
      ) : null}
    </section>
  );
}
