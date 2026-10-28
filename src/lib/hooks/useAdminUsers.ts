"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { fa } from "@/lib/i18n/fa";
import { useAuth } from "./useAuth";

export type AdminUserRecord = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: "user" | "admin";
  memberSince: string;
  orderCount: number;
  totalSpentToman: number;
  isGuest: boolean;
};

type UsersResponse = {
  users: AdminUserRecord[];
  total: number;
  totalPages: number;
  page: number;
};

async function parseJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export function useAdminUsers() {
  const auth = useAuth();
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = auth.user?.role === "admin";
  const selfId = auth.user?.id;

  const loadUsers = useCallback(
    async (searchQuery: string, targetPage: number) => {
      if (!isAdmin) return;
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ page: String(targetPage) });
        if (searchQuery.trim()) params.set("q", searchQuery.trim());
        const response = await fetch(`/api/admin/users?${params.toString()}`);
        if (response.status === 401 || response.status === 403) {
          toast.error(fa.admin.forbidden);
          setUsers([]);
          return;
        }
        if (!response.ok) {
          toast.error("دریافت کاربران انجام نشد.");
          return;
        }
        const data = await parseJson<UsersResponse>(response);
        setUsers(data?.users ?? []);
        setPagination({
          page: data?.page ?? 1,
          totalPages: data?.totalPages ?? 1,
          total: data?.total ?? 0,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [isAdmin]
  );

  useEffect(() => {
    if (isAdmin) {
      void loadUsers(query, page);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, page]);

  // debounce search
  useEffect(() => {
    if (!isAdmin) return;
    const timer = window.setTimeout(() => {
      setPage(1);
      void loadUsers(query, 1);
    }, 350);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const changeRole = useCallback(
    async (userId: string, role: "user" | "admin"): Promise<boolean> => {
      if (!isAdmin) return false;
      setIsSaving(true);
      try {
        const response = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
        });
        const data = await parseJson<{ message?: string }>(response);
        if (!response.ok) {
          toast.error(data?.message ?? "تغییر نقش انجام نشد.");
          return false;
        }
        toast.success(role === "admin" ? fa.admin.users.makeAdmin : fa.admin.users.makeUser);
        await loadUsers(query, page);
        return true;
      } finally {
        setIsSaving(false);
      }
    },
    [isAdmin, loadUsers, query, page]
  );

  return {
    isAdmin,
    users,
    pagination,
    query,
    setQuery,
    page,
    setPage,
    isLoading,
    isSaving,
    selfId,
    loadUsers,
    changeRole,
  };
}
