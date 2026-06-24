"use client";

import { apiFetch } from "@/lib/api/client-fetch";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { VendorProfileDto } from "@/lib/types/vendor";
import { useAuth } from "./useAuth";
import { useAdminAccess } from "./useAdminAccess";
import { getAuthDeniedMessage, isAuthDenied, parseJsonResponse } from "./fetch-utils";
import { fa } from "@/lib/i18n/fa";

export type AdminVendorFilter = "pending_review" | "active" | "all";

export function useAdminVendors() {
  const auth = useAuth();
  const [vendors, setVendors] = useState<VendorProfileDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<AdminVendorFilter>("pending_review");

  const isAdmin = auth.user?.role === "admin";
  const allowed = useAdminAccess(isAdmin);

  const loadVendors = useCallback(
    async (filter: AdminVendorFilter = statusFilter) => {
      if (!isAdmin) return;
      setIsLoading(true);
      try {
        const endpoint =
          filter === "pending_review"
            ? "/api/admin/vendors/pending"
            : `/api/admin/vendors?status=${encodeURIComponent(filter)}`;
        const response = await apiFetch(endpoint);
        if (isAuthDenied(response)) {
          toast.error(getAuthDeniedMessage(response.status, "admin"));
          setVendors([]);
          return;
        }
        if (!response.ok) {
          toast.error("دریافت فهرست فروشندگان انجام نشد.");
          return;
        }
        const data = await parseJsonResponse<{ vendors: VendorProfileDto[] }>(response);
        setVendors(data?.vendors ?? []);
      } finally {
        setIsLoading(false);
      }
    },
    [isAdmin, statusFilter]
  );

  const approveVendor = useCallback(
    async (vendorId: string) => {
      if (!isAdmin) return false;
      setIsSaving(true);
      try {
        const response = await apiFetch(`/api/admin/vendors/${encodeURIComponent(vendorId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "approve" }),
        });
        const data = await parseJsonResponse<{ vendor?: VendorProfileDto; message?: string }>(
          response
        );
        if (!response.ok || !data?.vendor) {
          toast.error(data?.message ?? "تأیید فروشنده انجام نشد.");
          return false;
        }
        toast.success(fa.admin.vendors.approveSuccess);
        setVendors((prev) => prev.filter((v) => v.id !== vendorId));
        return true;
      } finally {
        setIsSaving(false);
      }
    },
    [isAdmin]
  );

  const rejectVendor = useCallback(
    async (vendorId: string, reason: string) => {
      if (!isAdmin) return false;
      setIsSaving(true);
      try {
        const response = await apiFetch(`/api/admin/vendors/${encodeURIComponent(vendorId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "reject", reason }),
        });
        const data = await parseJsonResponse<{ vendor?: VendorProfileDto; message?: string }>(
          response
        );
        if (!response.ok || !data?.vendor) {
          toast.error(data?.message ?? "رد فروشنده انجام نشد.");
          return false;
        }
        toast.success(fa.admin.vendors.rejectSuccess);
        setVendors((prev) => prev.filter((v) => v.id !== vendorId));
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
    vendors,
    isLoading,
    isSaving,
    statusFilter,
    setStatusFilter,
    loadVendors,
    approveVendor,
    rejectVendor,
  };
}
