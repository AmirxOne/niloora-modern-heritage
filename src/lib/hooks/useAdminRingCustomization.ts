"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import type {
  RingCustomizationAdminCatalogDto,
  RingCustomizationAdminConfigDto,
} from "@/lib/types/ring-customization";
import { useAuth } from "@/lib/hooks/useAuth";
import { useAdminAccess } from "@/lib/hooks/useAdminAccess";
import { parseJsonResponse } from "@/lib/hooks/fetch-utils";

export function useAdminRingCustomization() {
  const auth = useAuth();
  const isAdmin = auth.user?.role === "admin";
  const allowed = useAdminAccess(isAdmin);
  const [catalog, setCatalog] = useState<RingCustomizationAdminCatalogDto | null>(null);
  const [config, setConfig] = useState<RingCustomizationAdminConfigDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadCatalog = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/ring-customization/catalog");
      const data = await parseJsonResponse<{ catalog?: RingCustomizationAdminCatalogDto; message?: string }>(
        response
      );
      if (!response.ok || !data?.catalog) {
        toast.error(data?.message ?? "دریافت کاتالوگ شخصی‌سازی انجام نشد.");
        return;
      }
      setCatalog(data.catalog);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  const loadProductConfig = useCallback(
    async (productId: string) => {
      if (!isAdmin || !productId.trim()) return;
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/admin/products/${encodeURIComponent(productId)}/ring-customization`
        );
        const data = await parseJsonResponse<{ ringCustomization?: RingCustomizationAdminConfigDto; message?: string }>(
          response
        );
        if (!response.ok || !data?.ringCustomization) {
          toast.error(data?.message ?? "دریافت تنظیمات محصول انجام نشد.");
          return;
        }
        setConfig(data.ringCustomization);
      } finally {
        setIsLoading(false);
      }
    },
    [isAdmin]
  );

  const saveProductConfig = useCallback(
    async (
      productId: string,
      payload: {
        config?: Record<string, unknown>;
        whitelist?: Record<string, unknown>;
      }
    ) => {
      if (!isAdmin || !productId.trim()) return false;
      setIsSaving(true);
      try {
        const response = await fetch(
          `/api/admin/products/${encodeURIComponent(productId)}/ring-customization`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
        const data = await parseJsonResponse<{ ringCustomization?: RingCustomizationAdminConfigDto; message?: string }>(
          response
        );
        if (!response.ok || !data?.ringCustomization) {
          toast.error(data?.message ?? "ذخیره تنظیمات انجام نشد.");
          return false;
        }
        setConfig(data.ringCustomization);
        toast.success("تنظیمات شخصی‌سازی ذخیره شد.");
        return true;
      } finally {
        setIsSaving(false);
      }
    },
    [isAdmin]
  );

  const saveCatalog = useCallback(
    async (payload: Record<string, unknown>) => {
      if (!isAdmin) return false;
      setIsSaving(true);
      try {
        const response = await fetch("/api/admin/ring-customization/catalog", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await parseJsonResponse<{ catalog?: RingCustomizationAdminCatalogDto; message?: string }>(
          response
        );
        if (!response.ok || !data?.catalog) {
          toast.error(data?.message ?? "ذخیره کاتالوگ انجام نشد.");
          return false;
        }
        setCatalog(data.catalog);
        toast.success("کاتالوگ شخصی‌سازی ذخیره شد.");
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
    catalog,
    config,
    isLoading,
    isSaving,
    loadCatalog,
    loadProductConfig,
    saveProductConfig,
    saveCatalog,
  };
}

