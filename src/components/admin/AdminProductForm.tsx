"use client";

import Image from "next/image";
import { ENGRAVING_STYLES, METAL_OPTIONS, SHAPE_OPTIONS, STONE_OPTIONS } from "@/lib/constants";
import {
  adminProductFormToPayload,
  emptyAdminProductForm,
  type AdminProductFormValues,
} from "@/lib/admin/product-form";
import { PRODUCT_AVAILABILITY_OPTIONS, getProductStatusConfig } from "@/lib/product-status";
import type { CollectionDto } from "@/lib/server/products";
import { fa } from "@/lib/i18n/fa";
import { TextBox, TextAreaBox, SelectBox } from "@/components/inputs";
import { Button } from "@/components/ui/Button";
import type { RingStyle } from "@/lib/types";

const styleOptions: { value: RingStyle; label: string }[] = [
  { value: "solitaire", label: fa.shop.styles.solitaire },
  { value: "halo", label: fa.shop.styles.halo },
  { value: "vintage", label: fa.shop.styles.vintage },
  { value: "signet", label: fa.shop.styles.signet },
  { value: "eternity", label: fa.shop.styles.eternity },
  { value: "stackable", label: fa.shop.styles.stackable },
];

const availabilityOptions = PRODUCT_AVAILABILITY_OPTIONS.map((value) => ({
  value,
  label: getProductStatusConfig(value).label,
}));

const tierOptions = [
  { value: "premium", label: fa.admin.products.tierPremium },
  { value: "economy", label: fa.admin.products.tierEconomy },
];

interface AdminProductFormProps {
  mode: "create" | "edit";
  values: AdminProductFormValues;
  collections: CollectionDto[];
  isSaving: boolean;
  onChange: (values: AdminProductFormValues) => void;
  onSubmit: () => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export function AdminProductForm({
  mode,
  values,
  collections,
  isSaving,
  onChange,
  onSubmit,
  onCancel,
  onDelete,
}: AdminProductFormProps) {
  const set = <K extends keyof AdminProductFormValues>(
    key: K,
    value: AdminProductFormValues[K]
  ) => {
    onChange({ ...values, [key]: value });
  };

  const collectionOptions = [
    { value: "", label: fa.admin.products.noCollection },
    ...collections.map((c) => ({
      value: c.id,
      label: c.namePersian || c.name,
    })),
  ];

  return (
    <form
      className="admin-product-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <h2 className="admin-product-form-title">
        {mode === "create" ? fa.admin.products.createTitle : fa.admin.products.editTitle}
      </h2>

      <div className="admin-product-form-grid">
        <TextBox
          label={fa.admin.products.idLabel}
          value={values.id}
          onChange={(e) => set("id", e.target.value)}
          disabled={mode === "edit" || isSaving}
          inputClassName="auth-input-ltr"
          placeholder="shiraz-solitaire"
        />
        <TextBox
          label={fa.admin.products.namePersian}
          value={values.namePersian}
          onChange={(e) => set("namePersian", e.target.value)}
          disabled={isSaving}
        />
        <TextBox
          label={fa.admin.products.nameEnglish}
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          disabled={isSaving}
          inputClassName="auth-input-ltr"
        />
        <TextBox
          label={fa.admin.products.introVideoUrl}
          value={values.introVideoUrl}
          onChange={(e) => set("introVideoUrl", e.target.value)}
          disabled={isSaving}
          inputClassName="auth-input-ltr"
          placeholder="https://cdn.example.com/product-intro.mp4"
        />
        <SelectBox
          label={fa.admin.products.collection}
          value={values.collectionId}
          options={collectionOptions}
          onValueChange={(v) => set("collectionId", v)}
          disabled={isSaving}
        />
        <SelectBox
          label={fa.admin.products.availability}
          value={values.availability}
          options={availabilityOptions}
          onValueChange={(v) => set("availability", v as AdminProductFormValues["availability"])}
          disabled={isSaving}
        />
        <div>
          <TextBox
            label={fa.admin.products.stock}
            value={values.stock}
            onChange={(e) => set("stock", e.target.value)}
            disabled={isSaving}
            inputClassName="auth-input-ltr"
          />
          <p className="mt-1 text-xs text-silver">{fa.admin.products.stockHint}</p>
        </div>
        <SelectBox
          label={fa.shop.style}
          value={values.category}
          options={styleOptions}
          onValueChange={(v) => set("category", v as RingStyle)}
          disabled={isSaving}
        />
      </div>

      <fieldset className="admin-product-form-fieldset">
        <legend>{fa.admin.products.pricing}</legend>
        <div className="admin-product-form-grid">
          <TextBox
            label={fa.admin.products.price}
            value={values.price}
            onChange={(e) => set("price", e.target.value)}
            disabled={isSaving}
            inputClassName="auth-input-ltr"
          />
          <TextBox
            label={fa.admin.products.listPrice}
            value={values.listPrice}
            onChange={(e) => set("listPrice", e.target.value)}
            disabled={isSaving}
            inputClassName="auth-input-ltr"
          />
          <TextBox
            label={fa.admin.products.discountPercent}
            value={values.discountPercent}
            onChange={(e) => set("discountPercent", e.target.value)}
            disabled={isSaving}
            inputClassName="auth-input-ltr"
            placeholder="20"
          />
        </div>
        <p className="admin-product-form-hint">{fa.admin.products.pricingHint}</p>
      </fieldset>

      <fieldset className="admin-product-form-fieldset">
        <legend>{fa.admin.products.media}</legend>
        <TextBox
          label={fa.admin.products.mainImage}
          value={values.image}
          onChange={(e) => set("image", e.target.value)}
          disabled={isSaving}
          inputClassName="auth-input-ltr"
        />
        {values.image ? (
          <div className="admin-product-form-preview">
            <Image src={values.image} alt="" fill className="object-cover" sizes="120px" />
          </div>
        ) : null}
        <TextAreaBox
          label={fa.admin.products.galleryImages}
          value={values.galleryText}
          onChange={(e) => set("galleryText", e.target.value)}
          disabled={isSaving}
          rows={4}
          placeholder={fa.admin.products.galleryPlaceholder}
          className="auth-input-ltr font-mono text-sm"
        />
      </fieldset>

      <fieldset className="admin-product-form-fieldset">
        <legend>{fa.admin.products.specs}</legend>
        <div className="admin-product-form-grid">
          <SelectBox
            label={fa.shop.quickViewMetal}
            value={values.metal}
            options={METAL_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            onValueChange={(v) => set("metal", v as AdminProductFormValues["metal"])}
            disabled={isSaving}
          />
          <SelectBox
            label={fa.shop.quickViewStone}
            value={values.stone}
            options={STONE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            onValueChange={(v) => set("stone", v as AdminProductFormValues["stone"])}
            disabled={isSaving}
          />
          <SelectBox
            label={fa.customize.labels.stoneShape}
            value={values.stoneShape}
            options={SHAPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            onValueChange={(v) => set("stoneShape", v as AdminProductFormValues["stoneShape"])}
            disabled={isSaving}
          />
          <SelectBox
            label={fa.shop.engraving}
            value={values.engravingType}
            options={[
              { value: "none", label: fa.shop.engravingOptions.none },
              ...ENGRAVING_STYLES.map((o) => ({ value: o.value, label: o.label })),
            ]}
            onValueChange={(v) =>
              set("engravingType", v as AdminProductFormValues["engravingType"])
            }
            disabled={isSaving}
          />
          <SelectBox
            label={fa.admin.products.listingTier}
            value={values.listingTier}
            options={tierOptions}
            onValueChange={(v) => set("listingTier", v as "premium" | "economy")}
            disabled={isSaving}
          />
          <TextBox
            label={fa.admin.products.listingHeadline}
            value={values.listingHeadline}
            onChange={(e) => set("listingHeadline", e.target.value)}
            disabled={isSaving}
          />
        </div>
      </fieldset>

      <div className="admin-product-form-checks">
        <label className="admin-product-check">
          <input
            type="checkbox"
            checked={values.featured}
            onChange={(e) => set("featured", e.target.checked)}
            disabled={isSaving}
          />
          <span>{fa.admin.products.featured}</span>
        </label>
        <label className="admin-product-check">
          <input
            type="checkbox"
            checked={values.bestseller}
            onChange={(e) => set("bestseller", e.target.checked)}
            disabled={isSaving}
          />
          <span>{fa.admin.products.bestseller}</span>
        </label>
      </div>

      <div className="admin-product-form-actions">
        <Button type="submit" disabled={isSaving}>
          {isSaving
            ? fa.admin.products.saving
            : mode === "create"
              ? fa.admin.products.createSubmit
              : fa.admin.products.save}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          {fa.admin.products.cancel}
        </Button>
        {mode === "edit" && onDelete ? (
          <Button type="button" variant="outline" onClick={onDelete} disabled={isSaving}>
            {fa.admin.products.delete}
          </Button>
        ) : null}
      </div>
    </form>
  );
}

export { emptyAdminProductForm, adminProductFormToPayload };
