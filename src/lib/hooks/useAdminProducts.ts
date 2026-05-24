"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { AdminProductDto } from "@/lib/server/products/admin-product-dto";
import type { CollectionDto } from "@/lib/server/products";
import { useAuth } from "./useAuth";
import { parseJsonResponse } from "./fetch-utils";

export function useAdminProducts() {
  const auth = useAuth();
  const [products, setProducts] = useState<AdminProductDto[]>([]);
  const [collections, setCollections] = useState<CollectionDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = auth.user?.role === "admin";

  const loadCollections = useCallback(async () => {
    const response = await fetch("/api/admin/collections");
    if (!response.ok) return;
    const data = await parseJsonResponse<{ collections: CollectionDto[] }>(response);
    setCollections(data?.collections ?? []);
  }, []);

  const loadProducts = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/products");
      if (response.status === 401) {
        toast.error("دسترسی مدیریت ندارید.");
        setProducts([]);
        return;
      }
      if (!response.ok) {
        toast.error("دریافت محصولات انجام نشد.");
        return;
      }
      const data = await parseJsonResponse<{ products: AdminProductDto[] }>(response);
      setProducts(data?.products ?? []);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  const loadAll = useCallback(async () => {
    await Promise.all([loadCollections(), loadProducts()]);
  }, [loadCollections, loadProducts]);

  const createProduct = useCallback(
    async (payload: unknown) => {
      if (!isAdmin) return null;
      setIsSaving(true);
      try {
        const response = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await parseJsonResponse<{ product?: AdminProductDto; message?: string }>(response);
        if (!response.ok || !data?.product) {
          toast.error(data?.message ?? "ثبت محصول انجام نشد.");
          return null;
        }
        setProducts((prev) => [data.product!, ...prev]);
        toast.success("محصول جدید ثبت شد.");
        return data.product;
      } finally {
        setIsSaving(false);
      }
    },
    [isAdmin]
  );

  const updateProduct = useCallback(
    async (id: string, payload: unknown) => {
      if (!isAdmin) return null;
      setIsSaving(true);
      try {
        const response = await fetch(`/api/admin/products/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await parseJsonResponse<{ product?: AdminProductDto; message?: string }>(response);
        if (!response.ok || !data?.product) {
          toast.error(data?.message ?? "ذخیره محصول انجام نشد.");
          return null;
        }
        setProducts((prev) => prev.map((p) => (p.id === id ? data.product! : p)));
        toast.success("محصول به‌روزرسانی شد.");
        return data.product;
      } finally {
        setIsSaving(false);
      }
    },
    [isAdmin]
  );

  const deleteProduct = useCallback(
    async (id: string) => {
      if (!isAdmin) return false;
      setIsSaving(true);
      try {
        const response = await fetch(`/api/admin/products/${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        const data = await parseJsonResponse<{ message?: string }>(response);
        if (!response.ok) {
          toast.error(data?.message ?? "حذف محصول انجام نشد.");
          return false;
        }
        setProducts((prev) => prev.filter((p) => p.id !== id));
        toast.success("محصول حذف شد.");
        return true;
      } finally {
        setIsSaving(false);
      }
    },
    [isAdmin]
  );

  const bulkUpdateProducts = useCallback(
    async (payload: unknown) => {
      if (!isAdmin) return null;
      setIsSaving(true);
      try {
        const response = await fetch("/api/admin/products/bulk", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await parseJsonResponse<{
          updated?: AdminProductDto[];
          missingIds?: string[];
          message?: string;
        }>(response);
        if (!response.ok || !data?.updated) {
          toast.error(data?.message ?? "ویرایش گروهی انجام نشد.");
          return null;
        }
        const next = new Map(products.map((item) => [item.id, item]));
        for (const product of data.updated) {
          next.set(product.id, product);
        }
        setProducts(Array.from(next.values()));
        toast.success(`${data.updated.length.toLocaleString("fa-IR")} محصول به‌روزرسانی شد.`);
        if (data.missingIds && data.missingIds.length > 0) {
          toast.error(`${data.missingIds.length.toLocaleString("fa-IR")} شناسه یافت نشد.`);
        }
        return data;
      } finally {
        setIsSaving(false);
      }
    },
    [isAdmin, products]
  );

  const exportCsv = useCallback(async () => {
    if (!isAdmin) return;
    const response = await fetch("/api/admin/products/csv");
    if (!response.ok) {
      toast.error("خروجی CSV محصولات انجام نشد.");
      return;
    }
    const text = await response.text();
    const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "products.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [isAdmin]);

  const importCsv = useCallback(
    async (file: File) => {
      if (!isAdmin) return null;
      setIsSaving(true);
      try {
        const content = await file.text();
        const response = await fetch("/api/admin/products/csv", {
          method: "POST",
          headers: { "Content-Type": "text/csv" },
          body: content,
        });
        const data = await parseJsonResponse<{
          totalRows: number;
          created?: number;
          updated?: number;
          failed?: number;
          errors?: Array<{ row: number; id?: string; message: string }>;
          message?: string;
        }>(response);
        if (!response.ok || !data) {
          toast.error(data?.message ?? "ورود CSV محصولات انجام نشد.");
          return null;
        }
        await loadProducts();
        toast.success(
          `CSV محصولات پردازش شد: ایجاد ${data.created ?? 0} · بروزرسانی ${data.updated ?? 0} · خطا ${data.failed ?? 0}`
        );
        return data;
      } finally {
        setIsSaving(false);
      }
    },
    [isAdmin, loadProducts]
  );

  return {
    isAdmin,
    products,
    collections,
    isLoading,
    isSaving,
    loadAll,
    loadProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    bulkUpdateProducts,
    exportCsv,
    importCsv,
  };
}
