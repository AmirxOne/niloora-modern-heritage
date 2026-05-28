"use client";

import { useEffect, useState } from "react";
import { fa } from "@/lib/i18n/fa";
import type { AdminCampaignFormValues } from "@/lib/admin/campaign-form";
import type { AdminPromoCodeRecord } from "@/lib/server/promo/promo-code";
import { SelectBox, TextAreaBox, TextBox } from "@/components/inputs";
import { parseJsonResponse } from "@/lib/hooks/fetch-utils";

type Props = {
  values: AdminCampaignFormValues;
  onChange: (values: AdminCampaignFormValues) => void;
  disabled?: boolean;
};

const discountTypeOptions = [
  { value: "percent", label: fa.admin.campaigns.typePercent },
  { value: "fixed", label: fa.admin.campaigns.typeFixed },
];

const targetScopeOptions = [
  { value: "all", label: fa.admin.campaigns.targetAll },
  { value: "products", label: fa.admin.campaigns.targetProducts },
  { value: "collections", label: fa.admin.campaigns.targetCollections },
];

export function AdminCampaignForm({ values, onChange, disabled }: Props) {
  const [promoCodes, setPromoCodes] = useState<AdminPromoCodeRecord[]>([]);

  useEffect(() => {
    fetch("/api/admin/promo-codes")
      .then((response) =>
        response.ok ? parseJsonResponse<{ promoCodes: AdminPromoCodeRecord[] }>(response) : null
      )
      .then((data) => setPromoCodes(data?.promoCodes ?? []))
      .catch(() => undefined);
  }, []);

  const set = <K extends keyof AdminCampaignFormValues>(
    key: K,
    value: AdminCampaignFormValues[K]
  ) => {
    onChange({ ...values, [key]: value });
  };

  const promoOptions = [
    { value: "", label: fa.admin.campaigns.linkedPromoNone },
    ...promoCodes.map((p) => ({
      value: p.id,
      label: `${p.code} — ${p.label}`,
    })),
  ];

  return (
    <div className="admin-promo-form grid gap-4">
      <TextBox
        label={fa.admin.campaigns.slug}
        value={values.slug}
        onChange={(e) => set("slug", e.target.value)}
        disabled={disabled}
        inputClassName="auth-input-ltr"
        placeholder="spring-sale"
      />
      <TextBox
        label={fa.admin.campaigns.titleLabel}
        value={values.title}
        onChange={(e) => set("title", e.target.value)}
        disabled={disabled}
      />
      <TextAreaBox
        label={fa.admin.campaigns.description}
        value={values.description}
        onChange={(e) => set("description", e.target.value)}
        disabled={disabled}
        rows={3}
      />
      <SelectBox
        label={fa.admin.campaigns.type}
        value={values.discountType}
        options={discountTypeOptions}
        disabled={disabled}
        onValueChange={(v) => set("discountType", v as AdminCampaignFormValues["discountType"])}
      />
      <TextBox
        label={fa.admin.campaigns.value}
        value={values.discountValue}
        onChange={(e) => set("discountValue", e.target.value)}
        disabled={disabled}
        inputClassName="auth-input-ltr"
      />
      <TextBox
        label={fa.admin.campaigns.minSubtotal}
        value={values.minSubtotal}
        onChange={(e) => set("minSubtotal", e.target.value)}
        disabled={disabled}
        inputClassName="auth-input-ltr"
      />
      <SelectBox
        label={fa.admin.campaigns.targetScope}
        value={values.targetScope}
        options={targetScopeOptions}
        disabled={disabled}
        onValueChange={(v) => set("targetScope", v as AdminCampaignFormValues["targetScope"])}
      />
      {values.targetScope === "products" ? (
        <TextAreaBox
          label={fa.admin.campaigns.targetProductIds}
          value={values.targetProductIds}
          onChange={(e) => set("targetProductIds", e.target.value)}
          disabled={disabled}
          rows={4}
          placeholder={fa.admin.campaigns.targetProductIdsHint}
          className="auth-input-ltr"
        />
      ) : null}
      {values.targetScope === "collections" ? (
        <TextAreaBox
          label={fa.admin.campaigns.targetCollectionIds}
          value={values.targetCollectionIds}
          onChange={(e) => set("targetCollectionIds", e.target.value)}
          disabled={disabled}
          rows={2}
          placeholder={fa.admin.campaigns.targetCollectionIdsHint}
          className="auth-input-ltr"
        />
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextBox
          label={fa.admin.campaigns.startsAt}
          type="datetime-local"
          value={values.startsAt}
          onChange={(e) => set("startsAt", e.target.value)}
          disabled={disabled}
          inputClassName="auth-input-ltr"
        />
        <TextBox
          label={fa.admin.campaigns.endsAt}
          type="datetime-local"
          value={values.endsAt}
          onChange={(e) => set("endsAt", e.target.value)}
          disabled={disabled}
          inputClassName="auth-input-ltr"
        />
      </div>
      <TextBox
        label={fa.admin.campaigns.priority}
        value={values.priority}
        onChange={(e) => set("priority", e.target.value)}
        disabled={disabled}
        inputClassName="auth-input-ltr"
      />
      <SelectBox
        label={fa.admin.campaigns.linkedPromo}
        value={values.linkedPromoCodeId}
        options={promoOptions}
        disabled={disabled}
        onValueChange={(v) => set("linkedPromoCodeId", v)}
      />
      <label className="flex items-center gap-2 text-sm text-ivory-light">
        <input
          type="checkbox"
          checked={values.replacesSiteWide}
          onChange={(e) => set("replacesSiteWide", e.target.checked)}
          disabled={disabled}
        />
        {fa.admin.campaigns.replacesSiteWide}
      </label>
      <label className="flex items-center gap-2 text-sm text-ivory-light">
        <input
          type="checkbox"
          checked={values.active}
          onChange={(e) => set("active", e.target.checked)}
          disabled={disabled}
        />
        {fa.admin.campaigns.active}
      </label>

      <hr className="border-white/10" />
      <p className="text-sm font-medium text-ivory">{fa.admin.campaigns.bannerSection}</p>
      <label className="flex items-center gap-2 text-sm text-ivory-light">
        <input
          type="checkbox"
          checked={values.bannerEnabled}
          onChange={(e) => set("bannerEnabled", e.target.checked)}
          disabled={disabled}
        />
        {fa.admin.campaigns.bannerEnabled}
      </label>
      <TextBox
        label={fa.admin.campaigns.bannerBadge}
        value={values.bannerBadge}
        onChange={(e) => set("bannerBadge", e.target.value)}
        disabled={disabled}
      />
      <TextBox
        label={fa.admin.campaigns.bannerTitle}
        value={values.bannerTitle}
        onChange={(e) => set("bannerTitle", e.target.value)}
        disabled={disabled}
      />
      <TextBox
        label={fa.admin.campaigns.bannerSubtitle}
        value={values.bannerSubtitle}
        onChange={(e) => set("bannerSubtitle", e.target.value)}
        disabled={disabled}
      />
      <TextBox
        label={fa.admin.campaigns.bannerCtaLabel}
        value={values.bannerCtaLabel}
        onChange={(e) => set("bannerCtaLabel", e.target.value)}
        disabled={disabled}
      />
      <TextBox
        label={fa.admin.campaigns.bannerCtaHref}
        value={values.bannerCtaHref}
        onChange={(e) => set("bannerCtaHref", e.target.value)}
        disabled={disabled}
        inputClassName="auth-input-ltr"
      />
      <TextBox
        label={fa.admin.campaigns.bannerImageUrl}
        value={values.bannerImageUrl}
        onChange={(e) => set("bannerImageUrl", e.target.value)}
        disabled={disabled}
        inputClassName="auth-input-ltr"
      />
    </div>
  );
}
