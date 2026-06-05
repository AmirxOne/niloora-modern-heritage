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
import { PRODUCT_AVAILABILITY_OPTIONS, getProductStatusConfig } from "@/lib/product-status";
import { fa } from "@/lib/i18n/fa";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SelectBox, TextBox } from "@/components/inputs";
import { AdminProductForm } from "@/components/admin/AdminProductForm";
import { LoadingState } from "@/components/ui/loading/LoadingState";

export function AdminProductsPanel() {
  const admin = useAdminProducts();
  const { isAdmin, loadAll } = admin;
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"create" | "edit" | null>(null);
  const [formValues, setFormValues] = useState<AdminProductFormValues>(emptyAdminProductForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkPrice, setBulkPrice] = useState("");
  const [bulkStock, setBulkStock] = useState("");
  const [bulkAvailability, setBulkAvailability] = useState("");
  const [bulkDiscountPercent, setBulkDiscountPercent] = useState("");
  const [importReport, setImportReport] = useState<string[]>([]);

  useEffect(() => {
    if (isAdmin) void loadAll();
  }, [isAdmin, loadAll]);

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

  const availabilityOptions = [
    { value: "", label: fa.admin.products.bulkNoChange },
    ...PRODUCT_AVAILABILITY_OPTIONS.map((value) => ({
      value,
      label: getProductStatusConfig(value).label,
    })),
  ];

  const allFilteredSelected = filtered.length > 0 && filtered.every((p) => selectedIds.includes(p.id));

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const toggleSelectAllFiltered = () => {
    setSelectedIds((prev) => {
      const filteredIds = filtered.map((item) => item.id);
      if (filteredIds.every((id) => prev.includes(id))) {
        return prev.filter((id) => !filteredIds.includes(id));
      }
      return Array.from(new Set([...prev, ...filteredIds]));
    });
  };

  const clearBulkForm = () => {
    setBulkPrice("");
    setBulkStock("");
    setBulkAvailability("");
    setBulkDiscountPercent("");
  };

  const handleBulkApply = async () => {
    if (selectedIds.length === 0) return;
    const payload: {
      ids: string[];
      price?: number;
      stock?: number;
      availability?: string;
      discountPercent?: number | null;
    } = { ids: selectedIds };

    if (bulkPrice.trim() !== "") payload.price = Number(bulkPrice);
    if (bulkStock.trim() !== "") payload.stock = Number(bulkStock);
    if (bulkAvailability.trim() !== "") payload.availability = bulkAvailability;
    if (bulkDiscountPercent.trim() === "-") {
      payload.discountPercent = null;
    } else if (bulkDiscountPercent.trim() !== "") {
      payload.discountPercent = Number(bulkDiscountPercent);
    }

    const result = await admin.bulkUpdateProducts(payload);
    if (!result) return;
    clearBulkForm();
    setSelectedIds((prev) => prev.filter((id) => !result.missingIds?.includes(id)));
  };

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

  if (!admin.allowed) return null;

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
          <Button type="button" variant="outline" onClick={() => void admin.exportExcel()}>
            خروجی Excel
          </Button>
          <label className="admin-file-upload-btn">
            ورود Excel
            <input
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              hidden
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const result = await admin.importExcel(file);
                if (result?.errors?.length) {
                  setImportReport(result.errors.slice(0, 20).map((item) => `ردیف ${item.row}: ${item.message}`));
                } else {
                  setImportReport([]);
                }
                e.currentTarget.value = "";
              }}
            />
          </label>
        </div>
        {importReport.length > 0 ? (
          <div className="admin-import-report">
            {importReport.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        ) : null}

        <div className="admin-products-bulk-panel">
          <div className="admin-products-bulk-head">
            <label className="admin-product-check">
              <input
                type="checkbox"
                checked={allFilteredSelected}
                onChange={toggleSelectAllFiltered}
              />
              <span>{fa.admin.products.bulkSelectAll}</span>
            </label>
            <p className="text-xs text-silver">
              {fa.admin.products.bulkSelectedCount(selectedIds.length)}
            </p>
          </div>
          <div className="admin-products-bulk-grid">
            <TextBox
              label={fa.admin.products.bulkPriceLabel}
              value={bulkPrice}
              onChange={(e) => setBulkPrice(e.target.value)}
              inputClassName="auth-input-ltr"
              disabled={admin.isSaving}
            />
            <TextBox
              label={fa.admin.products.bulkStockLabel}
              value={bulkStock}
              onChange={(e) => setBulkStock(e.target.value)}
              inputClassName="auth-input-ltr"
              disabled={admin.isSaving}
            />
            <SelectBox
              label={fa.admin.products.bulkAvailabilityLabel}
              value={bulkAvailability}
              options={availabilityOptions}
              onValueChange={setBulkAvailability}
              disabled={admin.isSaving}
            />
            <TextBox
              label={fa.admin.products.bulkDiscountLabel}
              value={bulkDiscountPercent}
              onChange={(e) => setBulkDiscountPercent(e.target.value)}
              inputClassName="auth-input-ltr"
              disabled={admin.isSaving}
            />
          </div>
          <div className="admin-products-bulk-actions">
            <Button
              type="button"
              onClick={() => void handleBulkApply()}
              disabled={admin.isSaving || selectedIds.length === 0}
            >
              {fa.admin.products.bulkApply}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={admin.isSaving}
              onClick={clearBulkForm}
            >
              {fa.admin.products.bulkClear}
            </Button>
          </div>
        </div>

        {admin.isLoading ? (
        <LoadingState variant="admin-cards" />
      ) : filtered.length === 0 ? (
          <p className="admin-orders-empty">{fa.admin.products.empty}</p>
        ) : (
          <ul className="admin-products-list">
            {filtered.map((product) => {
              const status = getProductStatusConfig(product.availability);
              const isActive = editingId === product.id;
              return (
                <li key={product.id}>
                  <div className={`admin-product-list-item${isActive ? " admin-product-list-item--active" : ""}`}>
                    <label className="admin-product-list-check">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(product.id)}
                        onChange={() => toggleSelect(product.id)}
                      />
                    </label>
                    <button type="button" className="admin-product-list-main" onClick={() => startEdit(product)}>
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
                  </div>
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
