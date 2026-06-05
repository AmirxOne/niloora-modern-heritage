"use client";

import { apiFetch } from "@/lib/api/client-fetch";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { AdminUser, AdminUserDetail, AdminUserRole, AdminUsersPagination } from "@/lib/types";
import { useAuth } from "./useAuth";
import { useAdminAccess } from "./useAdminAccess";
import { getAuthDeniedMessage, isAuthDenied, parseJsonResponse } from "./fetch-utils";

export function useAdminUsers() {
  const auth = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<AdminUsersPagination>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
  });
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = auth.user?.role === "admin";
  const allowed = useAdminAccess(isAdmin);

  const loadUsers = useCallback(
    async (opts?: { q?: string; page?: number; pageSize?: number }) => {
      if (!isAdmin) return;
      const q = opts?.q ?? search;
      const page = opts?.page ?? pagination.page;
      const pageSize = opts?.pageSize ?? pagination.pageSize;

      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (q.trim()) params.set("q", q.trim());
        params.set("page", String(page));
        params.set("pageSize", String(pageSize));

        const response = await apiFetch(`/api/admin/users?${params.toString()}`);
        if (isAuthDenied(response)) {
          toast.error(getAuthDeniedMessage(response.status, "admin"));
          setUsers([]);
          return;
        }
        if (!response.ok) {
          toast.error("دریافت لیست کاربران انجام نشد.");
          return;
        }

        const data = await parseJsonResponse<{
          users: AdminUser[];
          pagination: AdminUsersPagination;
        }>(response);
        setUsers(data?.users ?? []);
        if (data?.pagination) setPagination(data.pagination);
      } finally {
        setIsLoading(false);
      }
    },
    [isAdmin, pagination.page, pagination.pageSize, search]
  );

  const loadUserDetail = useCallback(
    async (userId: string): Promise<AdminUserDetail | null> => {
      if (!isAdmin) return null;
      const response = await apiFetch(`/api/admin/users/${encodeURIComponent(userId)}`);
      const data = await parseJsonResponse<{ user?: AdminUserDetail; message?: string }>(response);
      if (!response.ok || !data?.user) {
        toast.error(data?.message ?? "دریافت جزئیات کاربر انجام نشد.");
        return null;
      }
      return data.user;
    },
    [isAdmin]
  );

  const updateUser = useCallback(
    async (
      userId: string,
      payload: { role?: AdminUserRole; blocked?: boolean }
    ) => {
      if (!isAdmin) return false;
      setIsSaving(true);
      try {
        const response = await apiFetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await parseJsonResponse<{ user?: AdminUserDetail; message?: string }>(response);
        if (!response.ok || !data?.user) {
          toast.error(data?.message ?? "ذخیره تغییرات انجام نشد.");
          return false;
        }
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, ...data.user! } : u))
        );
        toast.success("کاربر به‌روزرسانی شد.");
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
    users,
    pagination,
    search,
    setSearch,
    isLoading,
    isSaving,
    loadUsers,
    loadUserDetail,
    updateUser,
    setPagination,
  };
}
