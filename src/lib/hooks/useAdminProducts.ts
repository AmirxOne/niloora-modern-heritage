"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { AdminProductDto } from "@/lib/server/products/admin-product-dto";
import type { CollectionDto } from "@/lib/server/products";
import { useAuth } from "./useAuth";

async function parseJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

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
    const data = await parseJson<{ collections: CollectionDto[] }>(response);
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
      const data = await parseJson<{ products: AdminProductDto[] }>(response);
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
        const data = await parseJson<{ product?: AdminProductDto; message?: string }>(response);
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
        const data = await parseJson<{ product?: AdminProductDto; message?: string }>(response);
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
        const data = await parseJson<{ message?: string }>(response);
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
  };
}
