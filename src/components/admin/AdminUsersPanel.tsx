"use client";

import { motion } from "framer-motion";
import type { AdminUserRecord } from "@/lib/hooks/useAdminUsers";
import { useAdminUsers } from "@/lib/hooks/useAdminUsers";
import { formatPrice } from "@/lib/utils";
import { fa } from "@/lib/i18n/fa";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TextBox } from "@/components/inputs";
import { Pagination } from "@/components/ui/Pagination";

const t = fa.admin.users;

function formatMemberSince(iso: string): string {
  return new Date(iso).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function UserCard({
  user,
  index,
  isSaving,
  isSelf,
  onRoleChange,
}: {
  user: AdminUserRecord;
  index: number;
  isSaving: boolean;
  isSelf: boolean;
  onRoleChange: (userId: string, role: "user" | "admin") => void;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
      className="admin-user-card rounded-heritage-lg border border-[#F0EDE9] bg-white p-5"
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-base font-semibold text-ivory">
            {user.name}
            {user.isGuest ? (
              <span className="mr-2 text-xs font-normal text-silver">
                ({t.guestBadge})
              </span>
            ) : null}
          </p>
          <p className="mt-1 font-mono text-sm text-silver" dir="ltr">
            {user.phone}
          </p>
          {user.email ? (
            <p className="mt-0.5 font-mono text-xs text-silver" dir="ltr">
              {user.email}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge variant={user.role === "admin" ? "royal" : "default"}>
            {user.role === "admin" ? t.roleAdmin : t.roleUser}
          </Badge>
          {isSelf ? <span className="text-[0.7rem] text-gold-dark">{t.selfHint}</span> : null}
        </div>
      </header>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-silver">
        <span>{t.ordersCount(user.orderCount)}</span>
        <span>
          {t.totalSpent}: {formatPrice(user.totalSpentToman)}
        </span>
        <span>
          {t.memberSince}: {formatMemberSince(user.memberSince)}
        </span>
      </div>

      <footer className="mt-4 flex justify-end">
        {!isSelf ? (
          <Button
            type="button"
            size="sm"
            variant={user.role === "admin" ? "outline" : "primary"}
            disabled={isSaving}
            onClick={() =>
              onRoleChange(user.id, user.role === "admin" ? "user" : "admin")
            }
          >
            {isSaving
              ? t.saving
              : user.role === "admin"
                ? t.makeUser
                : t.makeAdmin}
          </Button>
        ) : null}
      </footer>
    </motion.article>
  );
}

export function AdminUsersPanel() {
  const admin = useAdminUsers();

  if (!admin.isAdmin) {
    return (
      <div className="admin-users-forbidden py-16 text-center">
        <p className="text-ivory">{fa.admin.forbidden}</p>
      </div>
    );
  }

  return (
    <div className="admin-users-panel space-y-5">
      <div className="admin-users-toolbar flex flex-wrap items-end gap-4">
        <div className="min-w-[16rem] flex-1">
          <TextBox
            label={t.search}
            value={admin.query}
            onChange={(e) => admin.setQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            inputClassName="auth-input-ltr"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={admin.isLoading}
          onClick={() => void admin.loadUsers(admin.query, admin.page)}
        >
          {t.refresh}
        </Button>
      </div>

      {admin.isLoading ? (
        <div className="space-y-4" aria-busy="true" aria-live="polite">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="sk h-28 rounded-heritage-lg border border-[#F0EDE9]"
            />
          ))}
        </div>
      ) : admin.users.length === 0 ? (
        <p className="admin-users-empty py-12 text-center text-silver">{t.empty}</p>
      ) : (
        <div className="space-y-4">
          {admin.users.map((user, i) => (
            <UserCard
              key={user.id}
              user={user}
              index={i}
              isSaving={admin.isSaving}
              isSelf={user.id === admin.selfId}
              onRoleChange={(id, role) => void admin.changeRole(id, role)}
            />
          ))}
        </div>
      )}

      {admin.pagination.totalPages > 1 ? (
        <Pagination
          page={admin.pagination.page}
          totalPages={admin.pagination.totalPages}
          onPageChange={admin.setPage}
          totalItems={admin.pagination.total}
          from={(admin.pagination.page - 1) * 30 + 1}
          to={Math.min(admin.pagination.page * 30, admin.pagination.total)}
        />
      ) : null}
    </div>
  );
}
