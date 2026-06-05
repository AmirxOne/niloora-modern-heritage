"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  adminCampaignFormToPayload,
  adminCampaignToForm,
  emptyAdminCampaignForm,
  type AdminCampaignFormValues,
} from "@/lib/admin/campaign-form";
import type { AdminCampaignDetailRecord, AdminCampaignRecord } from "@/lib/server/campaigns/discount-campaign";
import { useAdminCampaigns } from "@/lib/hooks/useAdminCampaigns";
import { formatPrice } from "@/lib/utils";
import { fa } from "@/lib/i18n/fa";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AdminCampaignForm } from "@/components/admin/AdminCampaignForm";
import { LoadingState } from "@/components/ui/loading/LoadingState";

function formatCampaignDiscount(record: AdminCampaignRecord) {
  return record.discountType === "percent"
    ? `${record.discountValue.toLocaleString("fa-IR")}٪`
    : formatPrice(record.discountValue);
}

export function AdminCampaignsPanel() {
  const admin = useAdminCampaigns();
  const { isAdmin, loadCampaigns } = admin;
  const [mode, setMode] = useState<"create" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<AdminCampaignFormValues>(emptyAdminCampaignForm());
  const [detail, setDetail] = useState<AdminCampaignDetailRecord | null>(null);

  useEffect(() => {
    if (isAdmin) void loadCampaigns();
  }, [isAdmin, loadCampaigns]);

  const startCreate = () => {
    setMode("create");
    setEditingId(null);
    setDetail(null);
    setFormValues(emptyAdminCampaignForm());
  };

  const startEdit = async (record: AdminCampaignRecord) => {
    setMode("edit");
    setEditingId(record.id);
    setFormValues(adminCampaignToForm(record));
    const loaded = await admin.loadCampaignDetail(record.id);
    setDetail(loaded);
  };

  const cancelForm = () => {
    setMode(null);
    setEditingId(null);
    setDetail(null);
    setFormValues(emptyAdminCampaignForm());
  };

  const handleSubmit = async () => {
    const payload = adminCampaignFormToPayload(formValues);
    if (mode === "create") {
      const created = await admin.createCampaign(payload);
      if (created) cancelForm();
      return;
    }
    if (mode === "edit" && editingId) {
      const updated = await admin.updateCampaign(editingId, payload);
      if (updated) {
        setFormValues(adminCampaignToForm(updated));
        const loaded = await admin.loadCampaignDetail(editingId);
        setDetail(loaded);
      }
    }
  };

  const handleDelete = async () => {
    if (!editingId) return;
    if (!window.confirm(fa.admin.campaigns.deleteConfirm)) return;
    const ok = await admin.deleteCampaign(editingId);
    if (ok) cancelForm();
  };

  if (!admin.allowed) return null;

  return (
    <div className="admin-orders-panel">
      <div className="admin-orders-toolbar">
        <Button type="button" onClick={startCreate}>
          {fa.admin.campaigns.add}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={admin.isLoading}
          onClick={() => void admin.loadCampaigns()}
        >
          {fa.admin.campaigns.refresh}
        </Button>
      </div>

      {mode ? (
        <section className="admin-order-card mb-6">
          <h2 className="admin-page-title text-lg">
            {mode === "create" ? fa.admin.campaigns.createTitle : fa.admin.campaigns.editTitle}
          </h2>
          <AdminCampaignForm
            values={formValues}
            onChange={setFormValues}
            disabled={admin.isSaving}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" onClick={() => void handleSubmit()} disabled={admin.isSaving}>
              {admin.isSaving ? fa.admin.campaigns.saving : fa.admin.campaigns.save}
            </Button>
            <Button type="button" variant="outline" onClick={cancelForm}>
              {fa.admin.campaigns.cancel}
            </Button>
            {mode === "edit" ? (
              <Button
                type="button"
                variant="outline"
                className="text-copper"
                onClick={() => void handleDelete()}
                disabled={admin.isSaving}
              >
                {fa.admin.campaigns.delete}
              </Button>
            ) : null}
          </div>

          {detail ? (
            <div className="mt-8 border-t border-white/10 pt-6">
              <h3 className="mb-3 text-base font-medium text-ivory">{fa.admin.campaigns.usageReport}</h3>
              <div className="mb-4 grid gap-2 text-sm text-silver sm:grid-cols-2">
                <p>
                  {fa.admin.campaigns.usageCount}:{" "}
                  <span className="text-ivory">{detail.usageCount.toLocaleString("fa-IR")}</span>
                </p>
                <p>
                  {fa.admin.campaigns.totalDiscount}:{" "}
                  <span className="text-ivory">{formatPrice(detail.totalDiscountGiven)}</span>
                </p>
              </div>
              {detail.recentUsages.length === 0 ? (
                <p className="text-sm text-silver">{fa.admin.campaigns.usageEmpty}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-right text-silver">
                        <th className="py-2">{fa.admin.campaigns.usageOrder}</th>
                        <th className="py-2">{fa.admin.campaigns.usageAmount}</th>
                        <th className="py-2">{fa.admin.campaigns.usageDate}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.recentUsages.map((row) => (
                        <tr key={row.id} className="border-t border-white/5 text-ivory-light">
                          <td className="py-2 font-mono" dir="ltr">
                            <Link
                              href={`/admin/orders`}
                              className="text-turquoise-dark hover:text-turquoise"
                            >
                              {row.orderId}
                            </Link>
                          </td>
                          <td className="py-2">{formatPrice(row.discountAmount)}</td>
                          <td className="py-2">
                            {new Date(row.createdAt).toLocaleString("fa-IR")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : null}
        </section>
      ) : null}

      {admin.isLoading ? (
        <LoadingState variant="admin-cards" />
      ) : admin.campaigns.length === 0 ? (
        <p className="admin-orders-empty">{fa.admin.campaigns.empty}</p>
      ) : (
        <div className="admin-orders-list">
          {admin.campaigns.map((record) => (
            <article key={record.id} className="admin-order-card">
              <header className="admin-order-card-header">
                <div>
                  <p className="admin-order-id font-mono" dir="ltr">
                    {record.slug}
                  </p>
                  <p className="admin-order-customer">{record.title}</p>
                  <p className="admin-order-date text-xs">
                    {formatCampaignDiscount(record)} · {fa.admin.campaigns.targetLabel(record.targetScope)}
                    {record.linkedPromoCode ? ` · ${record.linkedPromoCode}` : ""}
                  </p>
                  <p className="text-xs text-silver">
                    {fa.admin.campaigns.usageCount}: {record.usageCount.toLocaleString("fa-IR")} ·{" "}
                    {formatPrice(record.totalDiscountGiven)}
                  </p>
                </div>
                <Badge variant={record.active ? "turquoise" : "default"}>
                  {record.active ? fa.admin.campaigns.active : fa.admin.campaigns.inactive}
                </Badge>
              </header>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => void startEdit(record)}>
                  {fa.admin.campaigns.editTitle}
                </Button>
                <Link
                  href={record.shopHref}
                  className="inline-flex items-center text-sm text-turquoise-dark hover:text-turquoise"
                >
                  {fa.admin.campaigns.viewInShop}
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
