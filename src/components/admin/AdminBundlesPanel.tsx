"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AdminBundleForm } from "@/components/admin/AdminBundleForm";
import { useAdminBundles } from "@/lib/hooks/useAdminBundles";
import { LoadingState } from "@/components/ui/loading/LoadingState";
import { fa } from "@/lib/i18n/fa";
import type { BundleOfferDefinition } from "@/lib/types";
import {
  adminBundleFormToPayload,
  adminBundleToForm,
  emptyAdminBundleForm,
  type AdminBundleFormValues,
} from "@/lib/admin/bundle-form";

export function AdminBundlesPanel() {
  const admin = useAdminBundles();
  const { allowed, isAdmin, isLoading, isSaving, bundles, loadBundles, createBundle, updateBundle, deleteBundle } = admin;
  const [mode, setMode] = useState<"create" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<AdminBundleFormValues>(emptyAdminBundleForm());

  useEffect(() => {
    if (isAdmin) void loadBundles();
  }, [isAdmin, loadBundles]);

  const startCreate = () => {
    setMode("create");
    setEditingId(null);
    setFormValues(emptyAdminBundleForm());
  };

  const startEdit = (bundle: BundleOfferDefinition) => {
    setMode("edit");
    setEditingId(bundle.id);
    setFormValues(adminBundleToForm(bundle));
  };

  const cancelForm = () => {
    setMode(null);
    setEditingId(null);
    setFormValues(emptyAdminBundleForm());
  };

  const handleSubmit = async () => {
    const payload = adminBundleFormToPayload(formValues);
    if (mode === "create") {
      const created = await createBundle(payload);
      if (created) cancelForm();
      return;
    }
    if (mode === "edit" && editingId) {
      const updated = await updateBundle(editingId, payload);
      if (updated) {
        setFormValues(adminBundleToForm(updated));
      }
    }
  };

  const handleDelete = async () => {
    if (!editingId) return;
    if (!window.confirm(fa.admin.bundles.deleteConfirm)) return;
    const ok = await deleteBundle(editingId);
    if (ok) cancelForm();
  };

  if (!allowed) return null;

  return (
    <div className="admin-orders-panel">
      <div className="admin-orders-toolbar">
        <Button type="button" onClick={startCreate}>
          {fa.admin.bundles.add}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isLoading}
          onClick={() => void loadBundles()}
        >
          {fa.admin.bundles.refresh}
        </Button>
      </div>

      {mode ? (
        <section className="admin-order-card mb-6">
          <h2 className="admin-page-title text-lg">
            {mode === "create" ? fa.admin.bundles.createTitle : fa.admin.bundles.editTitle}
          </h2>
          <AdminBundleForm values={formValues} onChange={setFormValues} disabled={isSaving} />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" onClick={() => void handleSubmit()} disabled={isSaving}>
              {isSaving ? fa.admin.bundles.saving : fa.admin.bundles.save}
            </Button>
            <Button type="button" variant="outline" onClick={cancelForm}>
              {fa.admin.bundles.cancel}
            </Button>
            {mode === "edit" ? (
              <Button
                type="button"
                variant="outline"
                className="text-copper"
                onClick={() => void handleDelete()}
                disabled={isSaving}
              >
                {fa.admin.bundles.delete}
              </Button>
            ) : null}
          </div>
        </section>
      ) : null}

      {isLoading ? (
        <LoadingState variant="admin-cards" count={2} />
      ) : bundles.length === 0 ? (
        <p className="admin-orders-empty">{fa.admin.bundles.empty}</p>
      ) : (
        <div className="admin-orders-list">
          {bundles.map((bundle) => (
            <article key={bundle.id} className="admin-order-card">
              <header className="admin-order-card-header">
                <div>
                  <p className="admin-order-customer">{bundle.title}</p>
                  {bundle.description ? <p className="admin-order-date">{bundle.description}</p> : null}
                  <p className="admin-order-date text-xs">
                    {bundle.discountType === "percent"
                      ? `${bundle.discountValue.toLocaleString("fa-IR")}٪`
                      : `${bundle.discountValue.toLocaleString("fa-IR")} تومان`}
                    {" · "}
                    {fa.admin.bundles.requiredCount(bundle.requiredProductIds.length)}
                  </p>
                </div>
                <Badge variant={bundle.active ? "turquoise" : "default"}>
                  {bundle.active ? fa.admin.bundles.active : fa.admin.bundles.inactive}
                </Badge>
              </header>
              <Button type="button" size="sm" variant="outline" onClick={() => startEdit(bundle)}>
                {fa.admin.bundles.editTitle}
              </Button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
