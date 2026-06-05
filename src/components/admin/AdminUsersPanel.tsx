"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { AdminUser, AdminUserDetail, AdminUserRole } from "@/lib/types";
import { useAdminUsers } from "@/lib/hooks/useAdminUsers";
import { formatPrice } from "@/lib/utils";
import { fa } from "@/lib/i18n/fa";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { SelectBox, TextBox } from "@/components/inputs";
import { LoadingState } from "@/components/ui/loading/LoadingState";

const t = fa.admin.users;

const ADMIN_USER_ROLES: AdminUserRole[] = ["user", "editor", "reviewer", "admin"];

const roleLabels: Record<AdminUserRole, string> = {
  user: t.roles.user,
  editor: t.roles.editor,
  reviewer: t.roles.reviewer,
  admin: t.roles.admin,
};

const roleOptions = ADMIN_USER_ROLES.map((value) => ({
  value,
  label: roleLabels[value],
}));

function formatUserDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function AdminUserCard({
  user,
  index,
  isSaving,
  onSave,
  onLoadDetail,
}: {
  user: AdminUser;
  index: number;
  isSaving: boolean;
  onSave: (
    userId: string,
    payload: { role?: AdminUserRole; blocked?: boolean }
  ) => Promise<boolean>;
  onLoadDetail: (userId: string) => Promise<AdminUserDetail | null>;
}) {
  const [role, setRole] = useState<AdminUserRole>(user.role);
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    setRole(user.role);
  }, [user.id, user.role]);

  const roleDirty = role !== user.role;

  async function toggleExpanded() {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);
    if (!detail) {
      setDetailLoading(true);
      const loaded = await onLoadDetail(user.id);
      if (loaded) setDetail(loaded);
      setDetailLoading(false);
    }
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.4 }}
      className="admin-order-card admin-user-card"
    >
      <header className="admin-order-card-header">
        <div>
          <p className="admin-order-id">{user.name}</p>
          <p className="admin-order-customer" dir="ltr">
            {user.phone}
          </p>
          <p className="admin-order-date">
            {t.memberSince}: {formatUserDate(user.memberSince)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge variant={user.blocked ? "default" : "turquoise"}>
            {user.blocked ? t.blocked : t.active}
          </Badge>
          <Badge variant={user.role === "admin" ? "gold" : "royal"}>
            {roleLabels[user.role]}
          </Badge>
        </div>
      </header>

      <div className="admin-order-card-summary">
        <span>
          {t.orderCount}: {user.orderCount.toLocaleString("fa-IR")} · {t.totalSpent}:{" "}
          {formatPrice(user.totalSpent)}
        </span>
      </div>

      <div className="admin-order-card-form">
        <SelectBox
          label={t.roleLabel}
          value={role}
          options={roleOptions}
          disabled={isSaving}
          onValueChange={(value) => setRole(value as AdminUserRole)}
        />
        <div className="admin-user-actions">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isSaving}
            onClick={() => void onSave(user.id, { blocked: !user.blocked })}
          >
            {user.blocked ? t.unblockAction : t.blockAction}
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!roleDirty || isSaving}
            onClick={() => void onSave(user.id, { role })}
          >
            {isSaving ? t.saving : t.save}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => void toggleExpanded()}>
            {expanded ? t.hideDetails : t.viewDetails}
          </Button>
        </div>
      </div>

      {expanded ? (
        <div className="admin-user-detail">
          {detailLoading ? (
            <LoadingState variant="inline" className="py-4" />
          ) : detail ? (
            <dl className="admin-user-detail-grid">
              <div>
                <dt>{t.email}</dt>
                <dd dir="ltr">{detail.email ?? "—"}</dd>
              </div>
              <div>
                <dt>{t.location}</dt>
                <dd>
                  {[detail.province, detail.city].filter(Boolean).join("، ") || "—"}
                </dd>
              </div>
              <div>
                <dt>{t.referralCode}</dt>
                <dd dir="ltr">{detail.referralCode}</dd>
              </div>
              <div>
                <dt>{t.loyalty}</dt>
                <dd>
                  {detail.loyaltyTier} · {detail.loyaltyPoints.toLocaleString("fa-IR")} امتیاز
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-silver text-sm">{fa.admin.forbidden}</p>
          )}
        </div>
      ) : null}
    </motion.article>
  );
}

export function AdminUsersPanel() {
  const admin = useAdminUsers();
  const { isAdmin, loadUsers } = admin;

  useEffect(() => {
    if (isAdmin) {
      void loadUsers({ page: 1 });
    }
  }, [isAdmin, loadUsers]);

  const pageUsers = useMemo(() => admin.users, [admin.users]);

  if (!admin.allowed) return null;

  return (
    <div className="admin-orders-panel admin-users-panel">
      <div className="admin-orders-toolbar">
        <TextBox
          label={t.searchLabel}
          value={admin.search}
          onChange={(e) => admin.setSearch(e.target.value)}
          placeholder={t.searchPlaceholder}
          inputClassName="auth-input-ltr"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              void admin.loadUsers({ q: admin.search, page: 1 });
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          disabled={admin.isLoading}
          onClick={() => void admin.loadUsers({ q: admin.search, page: 1 })}
        >
          {t.refresh}
        </Button>
      </div>

      {admin.isLoading ? (
        <LoadingState variant="admin-cards" />
      ) : pageUsers.length === 0 ? (
        <p className="admin-orders-empty">{t.empty}</p>
      ) : (
        <div className="admin-orders-list">
          {pageUsers.map((user, i) => (
            <AdminUserCard
              key={user.id}
              user={user}
              index={i}
              isSaving={admin.isSaving}
              onSave={admin.updateUser}
              onLoadDetail={admin.loadUserDetail}
            />
          ))}
        </div>
      )}

      {admin.pagination.total > 0 ? (
        <Pagination
          className="admin-users-pagination"
          page={admin.pagination.page}
          totalPages={admin.pagination.totalPages}
          totalItems={admin.pagination.total}
          from={
            admin.pagination.total === 0
              ? 0
              : (admin.pagination.page - 1) * admin.pagination.pageSize + 1
          }
          to={Math.min(
            admin.pagination.page * admin.pagination.pageSize,
            admin.pagination.total
          )}
          pageSize={admin.pagination.pageSize}
          onPageChange={(page) => {
            admin.setPagination((prev) => ({ ...prev, page }));
            void admin.loadUsers({ q: admin.search, page });
          }}
          onPageSizeChange={(pageSize) => {
            admin.setPagination((prev) => ({ ...prev, pageSize, page: 1 }));
            void admin.loadUsers({ q: admin.search, page: 1, pageSize });
          }}
        />
      ) : null}
    </div>
  );
}
