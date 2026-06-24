"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AdminRejectReasonModal } from "@/components/admin/AdminRejectReasonModal";
import { VendorStatusBadge } from "@/components/vendor/VendorStatusBadge";
import { useAdminVendors, type AdminVendorFilter } from "@/lib/hooks/useAdminVendors";
import type { VendorProfileDto } from "@/lib/types/vendor";
import { fa } from "@/lib/i18n/fa";
import { Button } from "@/components/ui/Button";
import { SelectBox } from "@/components/inputs";
import { LoadingState } from "@/components/ui/loading/LoadingState";

const t = fa.admin.vendors;

const filterOptions: { value: AdminVendorFilter; label: string }[] = [
  { value: "pending_review", label: t.filterPending },
  { value: "active", label: t.filterActive },
  { value: "all", label: t.filterAll },
];

function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function contactLine(vendor: VendorProfileDto): string {
  const parts = [vendor.contactPhone, vendor.contactEmail].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "—";
}

function AdminVendorCard({
  vendor,
  index,
  isSaving,
  showActions,
  onApprove,
  onReject,
}: {
  vendor: VendorProfileDto;
  index: number;
  isSaving: boolean;
  showActions: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.4 }}
      className="admin-order-card"
    >
      <header className="admin-order-card-header">
        <div>
          <p className="admin-order-id">{vendor.displayName}</p>
          {vendor.displayNameFa ? (
            <p className="admin-order-customer">{vendor.displayNameFa}</p>
          ) : null}
          <p className="admin-order-date" dir="ltr">
            {t.slug}: {vendor.slug}
          </p>
        </div>
        <VendorStatusBadge status={vendor.status} />
      </header>

      <div className="space-y-1 px-5 pb-3 text-sm text-silver">
        <p>
          {t.contact}: <span dir="ltr">{contactLine(vendor)}</span>
        </p>
        <p>
          {t.submittedAt}: {formatDate(vendor.submittedAt)}
        </p>
        {vendor.rejectionReason ? (
          <p className="text-red-700">{vendor.rejectionReason}</p>
        ) : null}
      </div>

      {showActions ? (
        <div className="flex flex-wrap gap-2 border-t border-parchment px-5 py-4">
          <Button type="button" size="sm" disabled={isSaving} onClick={() => onApprove(vendor.id)}>
            {t.approve}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isSaving}
            onClick={() => onReject(vendor.id)}
          >
            {t.reject}
          </Button>
        </div>
      ) : null}
    </motion.article>
  );
}

export function AdminVendorsPanel() {
  const admin = useAdminVendors();
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);

  useEffect(() => {
    if (admin.isAdmin) void admin.loadVendors(admin.statusFilter);
  }, [admin.isAdmin, admin.statusFilter, admin.loadVendors]);

  if (!admin.allowed) return null;

  const showActions = admin.statusFilter === "pending_review";

  return (
    <div className="admin-orders-panel">
      <div className="admin-orders-toolbar">
        <SelectBox
          label={t.filterLabel}
          value={admin.statusFilter}
          options={filterOptions}
          onValueChange={(value) => admin.setStatusFilter(value as AdminVendorFilter)}
        />
        <Button
          type="button"
          variant="outline"
          disabled={admin.isLoading}
          onClick={() => void admin.loadVendors(admin.statusFilter)}
        >
          {t.refresh}
        </Button>
      </div>

      {admin.isLoading ? (
        <LoadingState variant="admin-cards" />
      ) : admin.vendors.length === 0 ? (
        <p className="admin-orders-empty">{t.empty}</p>
      ) : (
        <div className="admin-orders-list">
          {admin.vendors.map((vendor, i) => (
            <AdminVendorCard
              key={vendor.id}
              vendor={vendor}
              index={i}
              isSaving={admin.isSaving}
              showActions={showActions}
              onApprove={(id) => void admin.approveVendor(id)}
              onReject={setRejectTargetId}
            />
          ))}
        </div>
      )}

      <AdminRejectReasonModal
        open={rejectTargetId !== null}
        title={t.rejectTitle}
        reasonLabel={t.rejectReasonLabel}
        confirmLabel={t.rejectConfirm}
        cancelLabel={t.cancel}
        isSaving={admin.isSaving}
        onClose={() => setRejectTargetId(null)}
        onConfirm={async (reason) => {
          if (!rejectTargetId) return;
          const ok = await admin.rejectVendor(rejectTargetId, reason);
          if (ok) setRejectTargetId(null);
        }}
      />
    </div>
  );
}
