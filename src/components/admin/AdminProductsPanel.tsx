"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  adminProductFormToPayload,
  adminProductToForm,
  emptyAdminProductForm,
  type AdminProductFormValues,
} from "@/lib/admin/product-form";
import type { AdminProductDto } from "@/lib/server/products/admin-product-dto";
import { useAdminProducts } from "@/lib/hooks/useAdminProducts";
import { formatPrice } from "@/lib/utils";
import { getProductStatusConfig } from "@/lib/product-status";
import { fa } from "@/lib/i18n/fa";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TextBox } from "@/components/inputs";
import { AdminProductForm } from "@/components/admin/AdminProductForm";

export function AdminProductsPanel() {
  const admin = useAdminProducts();
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"create" | "edit" | null>(null);
  const [formValues, setFormValues] = useState<AdminProductFormValues>(emptyAdminProductForm());
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (admin.isAdmin) void admin.loadAll();
  }, [admin.isAdmin, admin.loadAll]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return admin.products;
    return admin.products.filter(
      (p) =>
        p.id.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.namePersian.includes(search.trim()) ||
        (p.collectionName ?? "").includes(search.trim())
    );
  }, [admin.products, search]);

  const startCreate = () => {
    setMode("create");
    setEditingId(null);
    setFormValues(emptyAdminProductForm());
  };

  const startEdit = (product: AdminProductDto) => {
    setMode("edit");
    setEditingId(product.id);
    setFormValues(adminProductToForm(product));
  };

  const cancelForm = () => {
    setMode(null);
    setEditingId(null);
    setFormValues(emptyAdminProductForm());
  };

  const handleSubmit = async () => {
    const payload = adminProductFormToPayload(formValues);
    if (mode === "create") {
      const created = await admin.createProduct(payload);
      if (created) cancelForm();
      return;
    }
    if (mode === "edit" && editingId) {
      const updated = await admin.updateProduct(editingId, payload);
      if (updated) {
        setMode("edit");
        setFormValues(adminProductToForm(updated));
      }
    }
  };

  const handleDelete = async () => {
    if (!editingId) return;
    if (!window.confirm(fa.admin.products.deleteConfirm)) return;
    const ok = await admin.deleteProduct(editingId);
    if (ok) cancelForm();
  };

  if (!admin.isAdmin) {
    return (
      <div className="admin-orders-forbidden">
        <p className="text-ivory">{fa.admin.forbidden}</p>
      </div>
    );
  }

  return (
    <div className="admin-products-layout">
      <div className="admin-products-list-pane">
        <div className="admin-products-toolbar">
          <TextBox
            label={fa.admin.products.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button type="button" onClick={startCreate}>
            {fa.admin.products.add}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={admin.isLoading}
            onClick={() => void admin.loadProducts()}
          >
            {fa.admin.products.refresh}
          </Button>
        </div>

        {admin.isLoading ? (
          <p className="text-silver">{fa.admin.products.loading}</p>
        ) : filtered.length === 0 ? (
          <p className="admin-orders-empty">{fa.admin.products.empty}</p>
        ) : (
          <ul className="admin-products-list">
            {filtered.map((product) => {
              const status = getProductStatusConfig(product.availability);
              const isActive = editingId === product.id;
              return (
                <li key={product.id}>
                  <button
                    type="button"
                    className={`admin-product-list-item${isActive ? " admin-product-list-item--active" : ""}`}
                    onClick={() => startEdit(product)}
                  >
                    <div className="admin-product-list-thumb">
                      <Image
                        src={product.image}
                        alt={product.namePersian}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                    <div className="admin-product-list-body">
                      <p className="admin-product-list-name">{product.namePersian}</p>
                      <p className="admin-product-list-meta">
                        <span className="font-mono text-xs" dir="ltr">
                          {product.id}
                        </span>
                        {product.collectionName ? ` · ${product.collectionName}` : ""}
                      </p>
                      <p className="admin-product-list-price">
                        {formatPrice(product.price)}
                        {product.listPrice && product.listPrice > product.price ? (
                          <span className="text-silver line-through ms-2 text-xs">
                            {formatPrice(product.listPrice)}
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <Badge variant="gold">{status.shortLabel}</Badge>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="admin-products-form-pane">
        {mode ? (
          <AdminProductForm
            mode={mode}
            values={formValues}
            collections={admin.collections}
            isSaving={admin.isSaving}
            onChange={setFormValues}
            onSubmit={() => void handleSubmit()}
            onCancel={cancelForm}
            onDelete={mode === "edit" ? () => void handleDelete() : undefined}
          />
        ) : (
          <div className="admin-products-form-placeholder">
            <p className="text-ivory">{fa.admin.products.selectOrCreate}</p>
            <Button type="button" className="mt-4" onClick={startCreate}>
              {fa.admin.products.add}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
