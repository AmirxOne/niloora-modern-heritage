"use client";

import { apiFetch } from "@/lib/api/client-fetch";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { AdminProductDto } from "@/lib/server/products/admin-product-dto";
import { useAuth } from "./useAuth";
import { useAdminAccess } from "./useAdminAccess";
import { getAuthDeniedMessage, isAuthDenied, parseJsonResponse } from "./fetch-utils";
import { fa } from "@/lib/i18n/fa";

export type AdminPendingProductDto = AdminProductDto & {
  vendor: {
    id: string;
    slug: string;
    displayName: string;
    status: string;
  } | null;
};

export function useAdminPendingProducts() {
  const auth = useAuth();
  const [products, setProducts] = useState<AdminPendingProductDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = auth.user?.role === "admin";
  const allowed = useAdminAccess(isAdmin);

  const loadProducts = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    try {
      const response = await apiFetch("/api/admin/products/pending");
      if (isAuthDenied(response)) {
        toast.error(getAuthDeniedMessage(response.status, "admin"));
        setProducts([]);
        return;
      }
      if (!response.ok) {
        toast.error("دریافت محصولات در انتظار انجام نشد.");
        return;
      }
      const data = await parseJsonResponse<{ products: AdminPendingProductDto[] }>(response);
      setProducts(data?.products ?? []);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  const moderateProduct = useCallback(
    async (
      productId: string,
      body: {
        action: "approve" | "reject" | "edit_and_approve";
        reason?: string;
        patch?: { namePersian?: string; price?: number };
      }
    ) => {
      if (!isAdmin) return false;
      setIsSaving(true);
      try {
        const response = await apiFetch(
          `/api/admin/products/${encodeURIComponent(productId)}/moderate`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        );
        const data = await parseJsonResponse<{ product?: AdminProductDto; message?: string }>(
          response
        );
        if (!response.ok || !data?.product) {
          toast.error(data?.message ?? "عملیات انجام نشد.");
          return false;
        }
        if (body.action === "reject") {
          toast.success(fa.admin.productsPending.rejectSuccess);
        } else if (body.action === "edit_and_approve") {
          toast.success(fa.admin.productsPending.editApproveSuccess);
        } else {
          toast.success(fa.admin.productsPending.approveSuccess);
        }
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        return true;
      } finally {
        setIsSaving(false);
      }
    },
    [isAdmin]
  );

  return {
    allowed,
    isAdmin,
    products,
    isLoading,
    isSaving,
    loadProducts,
    moderateProduct,
  };
}
