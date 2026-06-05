"use client";

import { useEffect, useState } from "react";
import {
  adminPromoFormToPayload,
  adminPromoToForm,
  emptyAdminPromoForm,
  type AdminPromoFormValues,
} from "@/lib/admin/promo-form";
import type { AdminPromoCodeRecord } from "@/lib/server/promo/promo-code";
import { useAdminPromoCodes } from "@/lib/hooks/useAdminPromoCodes";
import { formatPrice } from "@/lib/utils";
import { fa } from "@/lib/i18n/fa";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AdminPromoCodeForm } from "@/components/admin/AdminPromoCodeForm";
import { LoadingState } from "@/components/ui/loading/LoadingState";

export function AdminPromoCodesPanel() {
  const admin = useAdminPromoCodes();
  const { isAdmin, loadPromoCodes } = admin;
  const [mode, setMode] = useState<"create" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<AdminPromoFormValues>(emptyAdminPromoForm());
  const [importReport, setImportReport] = useState<string[]>([]);

  useEffect(() => {
    if (isAdmin) void loadPromoCodes();
  }, [isAdmin, loadPromoCodes]);

  const startCreate = () => {
    setMode("create");
    setEditingId(null);
    setFormValues(emptyAdminPromoForm());
  };

  const startEdit = (record: AdminPromoCodeRecord) => {
    setMode("edit");
    setEditingId(record.id);
    setFormValues(adminPromoToForm(record));
  };

  const cancelForm = () => {
    setMode(null);
    setEditingId(null);
    setFormValues(emptyAdminPromoForm());
  };

  const handleSubmit = async () => {
    const payload = adminPromoFormToPayload(formValues);
    if (mode === "create") {
      const created = await admin.createPromoCode(payload);
      if (created) cancelForm();
      return;
    }
    if (mode === "edit" && editingId) {
      const updated = await admin.updatePromoCode(editingId, payload);
      if (updated) setFormValues(adminPromoToForm(updated));
    }
  };

  const handleDelete = async () => {
    if (!editingId) return;
    if (!window.confirm(fa.admin.promoCodes.deleteConfirm)) return;
    const ok = await admin.deletePromoCode(editingId);
    if (ok) cancelForm();
  };

  if (!admin.allowed) return null;

  return (
    <div className="admin-orders-panel">
      <div className="admin-orders-toolbar">
        <Button type="button" onClick={startCreate}>
          {fa.admin.promoCodes.add}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={admin.isLoading}
          onClick={() => void admin.loadPromoCodes()}
        >
          {fa.admin.promoCodes.refresh}
        </Button>
        <Button type="button" variant="outline" onClick={() => void admin.exportExcel()}>
          خروجی Excel
        </Button>
        <label className="admin-file-upload-btn">
          ورود Excel
          <input
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            hidden
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const result = await admin.importExcel(file);
              if (result?.errors?.length) {
                setImportReport(result.errors.slice(0, 20).map((item) => `ردیف ${item.row}: ${item.message}`));
              } else {
                setImportReport([]);
              }
              e.currentTarget.value = "";
            }}
          />
        </label>
      </div>
      {importReport.length > 0 ? (
        <div className="admin-import-report">
          {importReport.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      ) : null}

      {mode ? (
        <section className="admin-order-card mb-6">
          <h2 className="admin-page-title text-lg">
            {mode === "create" ? fa.admin.promoCodes.createTitle : fa.admin.promoCodes.editTitle}
          </h2>
          <AdminPromoCodeForm
            values={formValues}
            onChange={setFormValues}
            disabled={admin.isSaving}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" onClick={() => void handleSubmit()} disabled={admin.isSaving}>
              {admin.isSaving ? fa.admin.promoCodes.saving : fa.admin.promoCodes.save}
            </Button>
            <Button type="button" variant="outline" onClick={cancelForm}>
              {fa.admin.promoCodes.cancel}
            </Button>
            {mode === "edit" ? (
              <Button
                type="button"
                variant="outline"
                className="text-copper"
                onClick={() => void handleDelete()}
                disabled={admin.isSaving}
              >
                {fa.admin.promoCodes.delete}
              </Button>
            ) : null}
          </div>
        </section>
      ) : null}

      {admin.isLoading ? (
        <LoadingState variant="admin-cards" />
      ) : admin.promoCodes.length === 0 ? (
        <p className="admin-orders-empty">{fa.admin.promoCodes.empty}</p>
      ) : (
        <div className="admin-orders-list">
          {admin.promoCodes.map((record, index) => (
            <article key={record.id} className="admin-order-card">
              <header className="admin-order-card-header">
                <div>
                  <p className="admin-order-id font-mono" dir="ltr">
                    {record.code}
                  </p>
                  <p className="admin-order-customer">{record.label}</p>
                  <p className="admin-order-date text-xs">
                    {record.type === "percent"
                      ? `${record.value}٪`
                      : formatPrice(record.value)}{" "}
                    · حداقل {formatPrice(record.minSubtotal)}
                  </p>
                  {record.aliases.length > 0 ? (
                    <p className="text-xs text-silver" dir="ltr">
                      {record.aliases.join(" · ")}
                    </p>
                  ) : null}
                </div>
                <Badge variant={record.active ? "turquoise" : "default"}>
                  {record.active ? fa.admin.promoCodes.active : fa.admin.promoCodes.inactive}
                </Badge>
              </header>
              <Button type="button" size="sm" variant="outline" onClick={() => startEdit(record)}>
                {fa.admin.promoCodes.editTitle}
              </Button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
