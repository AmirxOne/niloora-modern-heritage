"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { AdminRejectReasonModal } from "@/components/admin/AdminRejectReasonModal";
import { PublicationStatusBadge } from "@/components/vendor/PublicationStatusBadge";
import { VendorStatusBadge } from "@/components/vendor/VendorStatusBadge";
import type { VendorStatus } from "@/lib/types/vendor";
import {
  useAdminPendingProducts,
  type AdminPendingProductDto,
} from "@/lib/hooks/useAdminPendingProducts";
import { formatPrice } from "@/lib/utils";
import { fa } from "@/lib/i18n/fa";
import { Button } from "@/components/ui/Button";
import { TextBox } from "@/components/inputs";
import { Modal } from "@/components/ui/Modal";
import { LoadingState } from "@/components/ui/loading/LoadingState";

const t = fa.admin.productsPending;

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

function AdminPendingProductCard({
  product,
  index,
  isSaving,
  onApprove,
  onReject,
  onEditApprove,
}: {
  product: AdminPendingProductDto;
  index: number;
  isSaving: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onEditApprove: (product: AdminPendingProductDto) => void;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.4 }}
      className="admin-order-card"
    >
      <header className="admin-order-card-header">
        <div className="flex items-start gap-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-parchment">
            <Image
              src={product.image}
              alt={product.namePersian}
              fill
              className="object-cover"
              sizes="56px"
            />
          </div>
          <div>
            <p className="admin-order-id">{product.namePersian}</p>
            <p className="admin-order-date font-mono text-xs" dir="ltr">
              {product.id}
            </p>
            <p className="admin-order-customer">{formatPrice(product.price)}</p>
          </div>
        </div>
        <PublicationStatusBadge status={product.publicationStatus} />
      </header>

      <div className="space-y-2 px-5 pb-3 text-sm text-silver">
        {product.vendor ? (
          <div className="flex flex-wrap items-center gap-2">
            <span>
              {t.vendorLabel}: {product.vendor.displayName}
            </span>
            <VendorStatusBadge status={product.vendor.status as VendorStatus} />
            <span className="font-mono text-xs" dir="ltr">
              {product.vendor.slug}
            </span>
          </div>
        ) : null}
        <p>
          {t.submittedAt}: {formatDate(product.updatedAt)}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-parchment px-5 py-4">
        <Button type="button" size="sm" disabled={isSaving} onClick={() => onApprove(product.id)}>
          {t.approve}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isSaving}
          onClick={() => onReject(product.id)}
        >
          {t.reject}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isSaving}
          onClick={() => onEditApprove(product)}
        >
          {t.editApprove}
        </Button>
      </div>
    </motion.article>
  );
}

export function AdminPendingProductsPanel() {
  const admin = useAdminPendingProducts();
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<AdminPendingProductDto | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");

  useEffect(() => {
    if (admin.isAdmin) void admin.loadProducts();
  }, [admin.isAdmin, admin.loadProducts]);

  const openEdit = (product: AdminPendingProductDto) => {
    setEditTarget(product);
    setEditName(product.namePersian);
    setEditPrice(String(product.price));
  };

  const closeEdit = () => {
    setEditTarget(null);
    setEditName("");
    setEditPrice("");
  };

  if (!admin.allowed) return null;

  return (
    <div className="admin-orders-panel">
      <div className="admin-orders-toolbar">
        <Button
          type="button"
          variant="outline"
          disabled={admin.isLoading}
          onClick={() => void admin.loadProducts()}
        >
          {t.refresh}
        </Button>
      </div>

      {admin.isLoading ? (
        <LoadingState variant="admin-cards" />
      ) : admin.products.length === 0 ? (
        <p className="admin-orders-empty">{t.empty}</p>
      ) : (
        <div className="admin-orders-list">
          {admin.products.map((product, i) => (
            <AdminPendingProductCard
              key={product.id}
              product={product}
              index={i}
              isSaving={admin.isSaving}
              onApprove={(id) => void admin.moderateProduct(id, { action: "approve" })}
              onReject={setRejectTargetId}
              onEditApprove={openEdit}
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
          const ok = await admin.moderateProduct(rejectTargetId, { action: "reject", reason });
          if (ok) setRejectTargetId(null);
        }}
      />

      <Modal isOpen={editTarget !== null} onClose={closeEdit} title={t.editTitle} size="sm">
        <div className="space-y-4 p-6">
          <TextBox
            label={t.editNamePersian}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            disabled={admin.isSaving}
          />
          <TextBox
            label={t.editPrice}
            value={editPrice}
            onChange={(e) => setEditPrice(e.target.value)}
            inputClassName="auth-input-ltr"
            disabled={admin.isSaving}
          />
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" disabled={admin.isSaving} onClick={closeEdit}>
              {t.cancel}
            </Button>
            <Button
              type="button"
              disabled={admin.isSaving || !editName.trim() || !editPrice.trim()}
              onClick={() => {
                if (!editTarget) return;
                void admin
                  .moderateProduct(editTarget.id, {
                    action: "edit_and_approve",
                    patch: {
                      namePersian: editName.trim(),
                      price: Number(editPrice),
                    },
                  })
                  .then((ok) => {
                    if (ok) closeEdit();
                  });
              }}
            >
              {t.editSave}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
