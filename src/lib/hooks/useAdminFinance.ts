"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import type {
  AdminFinancePagination,
  AdminFinanceSummary,
  AdminFinanceTransaction,
  AdminPaymentStatus,
} from "@/lib/types";
import { useAuth } from "./useAuth";
import { useAdminAccess } from "./useAdminAccess";
import { downloadExcelFromResponse } from "@/lib/admin/excel-io";
import { parseJsonResponse } from "./fetch-utils";

export type AdminFinanceFilters = {
  status: AdminPaymentStatus | "all";
  from: string;
  to: string;
};

export function useAdminFinance() {
  const auth = useAuth();
  const [transactions, setTransactions] = useState<AdminFinanceTransaction[]>([]);
  const [summary, setSummary] = useState<AdminFinanceSummary | null>(null);
  const [pagination, setPagination] = useState<AdminFinancePagination>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
  });
  const [filters, setFilters] = useState<AdminFinanceFilters>({
    status: "all",
    from: "",
    to: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const isAdmin = auth.user?.role === "admin";
  const allowed = useAdminAccess(isAdmin);

  const buildQuery = useCallback(
    (opts?: Partial<AdminFinanceFilters & { page?: number; pageSize?: number }>) => {
      const status = opts?.status ?? filters.status;
      const from = opts?.from ?? filters.from;
      const to = opts?.to ?? filters.to;
      const page = opts?.page ?? pagination.page;
      const pageSize = opts?.pageSize ?? pagination.pageSize;

      const params = new URLSearchParams();
      if (status !== "all") params.set("status", status);
      if (from.trim()) params.set("from", from.trim());
      if (to.trim()) params.set("to", to.trim());
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      return params.toString();
    },
    [filters, pagination.page, pagination.pageSize]
  );

  const loadFinance = useCallback(
    async (opts?: Partial<AdminFinanceFilters & { page?: number; pageSize?: number }>) => {
      if (!isAdmin) return;
      setIsLoading(true);
      try {
        const query = buildQuery(opts);
        const response = await fetch(`/api/admin/finance?${query}`);
        if (response.status === 401) {
          toast.error("دسترسی مدیریت ندارید.");
          setTransactions([]);
          setSummary(null);
          return;
        }
        if (!response.ok) {
          toast.error("دریافت گزارش مالی انجام نشد.");
          return;
        }

        const data = await parseJsonResponse<{
          transactions: AdminFinanceTransaction[];
          summary: AdminFinanceSummary;
          pagination: AdminFinancePagination;
        }>(response);

        setTransactions(data?.transactions ?? []);
        setSummary(data?.summary ?? null);
        if (data?.pagination) setPagination(data.pagination);
      } finally {
        setIsLoading(false);
      }
    },
    [buildQuery, isAdmin]
  );

  const exportExcel = useCallback(async () => {
    if (!isAdmin) return;
    const params = new URLSearchParams(buildQuery({ page: 1 }));
    params.delete("page");
    params.delete("pageSize");
    const response = await fetch(`/api/admin/finance/csv?${params.toString()}`);
    const ok = await downloadExcelFromResponse(response, "finance-transactions.xlsx");
    if (!ok) toast.error("خروجی Excel انجام نشد.");
  }, [buildQuery, isAdmin]);

  return {
    allowed,
    isAdmin,
    transactions,
    summary,
    pagination,
    filters,
    setFilters,
    isLoading,
    loadFinance,
    exportExcel,
    setPagination,
  };
}
